"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

interface ClientTypes {
  _id: string;
  nome: string;
  image: string;
}

interface Pagamento {
  valor: number;
  data: string;
  clientId: string;
}

type StatusFiltro = "todos" | "atrasado" | "vencendo" | "emdia";

const Page = () => {
  const [clients, setClients] = useState<ClientTypes[]>([]);
  const [pagamentos, setPagamentos] = useState<Record<string, Pagamento | null>>({});
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusFiltro>("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 10;

  const getClients = async () => {
    try {
      const response = await axios.get(`/api/Client`);
      setClients(response.data);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  const getUltimoPagamentoPorCliente = async (clientId: string) => {
    try {
      const response = await axios.get(`/api/Pagamentos?idClient=${clientId}`);
      const pagamentosDoAluno = response.data;

      if (pagamentosDoAluno.length > 0) {
        pagamentosDoAluno.sort(
          (a: Pagamento, b: Pagamento) =>
            new Date(b.data).getTime() - new Date(a.data).getTime()
        );
        return pagamentosDoAluno[0];
      }
      return null;
    } catch (error) {
      console.error(`Erro ao buscar pagamentos do aluno ${clientId}:`, error);
      return null;
    }
  };

  const fetchPagamentos = async (clientes: ClientTypes[]) => {
    const resultado: Record<string, Pagamento | null> = {};
    const vencendo: string[] = [];
    const atrasados: string[] = [];

    await Promise.all(
      clientes.map(async (client) => {
        const ultimo = await getUltimoPagamentoPorCliente(client._id);
        resultado[client._id] = ultimo;

        if (ultimo) {
          const ultimaData = new Date(ultimo.data);
          const proximaData = new Date(ultimaData);
          proximaData.setDate(ultimaData.getDate() + 30);

          const hoje = new Date();
          const diffDays = Math.ceil((proximaData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

          if (diffDays <= 5 && diffDays >= 0) {
            vencendo.push(client.nome);
          } else if (diffDays < 0) {
            atrasados.push(client.nome);
          }
        }
      })
    );

    if (vencendo.length > 0) {
      toast.warn(`⚠️ Pagamento vencendo para: ${vencendo.join(", ")}`);
    }

    if (atrasados.length > 0) {
      toast.error(`❗ Pagamento atrasado para: ${atrasados.join(", ")}`);
    }

    setPagamentos(resultado);
  };

  useEffect(() => {
    getClients();
  }, []);

  useEffect(() => {
    if (clients.length > 0) {
      fetchPagamentos(clients);
      const intervalId = setInterval(() => fetchPagamentos(clients), 30 * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [clients]);

  const obterStatusCliente = (pagamento: Pagamento | null) => {
    if (!pagamento) return null;
    const ultimaData = new Date(pagamento.data);
    const proximaData = new Date(ultimaData);
    proximaData.setDate(ultimaData.getDate() + 30);

    const hoje = new Date();
    const diffDays = Math.ceil((proximaData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 5) return "emdia";
    if (diffDays >= 0) return "vencendo";
    return "atrasado";
  };

  const clientesFiltrados = clients
    .filter((client) =>
      client.nome.toLowerCase().includes(filtroNome.toLowerCase())
    )
    .filter((client) => {
      const status = obterStatusCliente(pagamentos[client._id]);
      return filtroStatus === "todos" || status === filtroStatus;
    });

  const totalPaginas = Math.ceil(clientesFiltrados.length / itensPorPagina);
  const clientesPaginados = clientesFiltrados.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  return (
    <div className="p-4">
      <ToastContainer position="top-right" autoClose={6000} />
      <h1 className="text-xl sm:text-2xl font-semibold text-blue-700 mb-4">Lista de Alunos</h1>

      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <input
          type="text"
          placeholder="Pesquisar aluno..."
          className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={filtroNome}
          onChange={(e) => {
            setFiltroNome(e.target.value);
            setPaginaAtual(1);
          }}
        />

        <div className="flex gap-2 flex-wrap">
          {[
            { label: "Todos", value: "todos" },
            { label: "Em dia", value: "emdia" },
            { label: "Vencendo", value: "vencendo" },
            { label: "Atrasado", value: "atrasado" },
          ].map((btn) => (
            <button
              key={btn.value}
              className={`px-3 py-1 rounded-full border text-sm transition ${
                filtroStatus === btn.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600 border-blue-300"
              }`}
              onClick={() => {
                setFiltroStatus(btn.value as StatusFiltro);
                setPaginaAtual(1);
              }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-full bg-white divide-y divide-gray-200 text-sm">
          <thead className="bg-blue-100 text-blue-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2 text-left">Foto</th>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Último Pagamento</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Dias</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientesPaginados.map((client, index) => {
              const pagamento = pagamentos[client._id];
              const status = obterStatusCliente(pagamento);
              const numero = (paginaAtual - 1) * itensPorPagina + index + 1;

              let statusLabel: JSX.Element | null = null;
              let diasRestantes: number | null = null;
              let diasLabel: JSX.Element | null = null;

              if (pagamento) {
                const ultimaData = new Date(pagamento.data);
                const proximaData = new Date(ultimaData);
                proximaData.setDate(ultimaData.getDate() + 30);

                const hoje = new Date();
                diasRestantes = Math.ceil((proximaData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                const dataFormatada = proximaData.toLocaleDateString("pt-BR");

                if (diasRestantes > 5) {
                  statusLabel = <span className="text-green-600">✅ Em dia ({dataFormatada})</span>;
                } else if (diasRestantes >= 0) {
                  statusLabel = <span className="text-yellow-600">⏳ Vence em {diasRestantes} dia(s)</span>;
                } else {
                  statusLabel = <span className="text-red-600">❗ Atrasado ({dataFormatada})</span>;
                }

                diasLabel = (
                  <span className={diasRestantes < 0 ? "text-red-500" : "text-gray-700"}>
                    {diasRestantes} dia(s)
                  </span>
                );
              }

              return (
                <tr key={client._id} className="hover:bg-blue-50">
                  <td className="px-4 py-2 text-center">{numero}</td>
                  <td className="px-4 py-2">
                    <img
                      src={client.image}
                      alt={client.nome}
                      className="h-10 w-10 rounded-full object-cover border border-blue-200"
                    />
                  </td>
                  <td className="px-4 py-2 text-gray-800">{client.nome}</td>
                  <td className="px-4 py-2 text-gray-700">
                    {pagamento
                      ? new Date(pagamento.data).toLocaleDateString("pt-BR")
                      : <span className="text-gray-400 italic">Sem registro</span>}
                  </td>
                  <td className="px-4 py-2">{statusLabel ?? <span className="text-gray-400 italic">Sem pagamento</span>}</td>
                  <td className="px-4 py-2">{diasLabel ?? <span className="text-gray-400 italic">-</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button
            className="px-3 py-1 rounded border text-sm"
            disabled={paginaAtual === 1}
            onClick={() => setPaginaAtual((p) => p - 1)}
          >
            Anterior
          </button>
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              className={`px-3 py-1 rounded text-sm ${
                paginaAtual === num ? "bg-blue-600 text-white" : "bg-white border text-blue-600"
              }`}
              onClick={() => setPaginaAtual(num)}
            >
              {num}
            </button>
          ))}
          <button
            className="px-3 py-1 rounded border text-sm"
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPaginaAtual((p) => p + 1)}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
};

export default Page;
