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

const Page = () => {
  const [clients, setClients] = useState<ClientTypes[]>([]);
  const [pagamentos, setPagamentos] = useState<Record<string, Pagamento | null>>({});

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

    await Promise.all(
      clientes.map(async (client) => {
        const ultimo = await getUltimoPagamentoPorCliente(client._id);
        resultado[client._id] = ultimo;

        if (ultimo) {
          gerarMensagemDeNotificacao(ultimo, client.nome);
        }
      })
    );

    setPagamentos(resultado);
  };

  const gerarMensagemDeNotificacao = (pagamento: Pagamento, nomeAluno: string) => {
    const ultimaData = new Date(pagamento.data);
    const proximaData = new Date(ultimaData);
    proximaData.setDate(ultimaData.getDate() + 30);

    const hoje = new Date();
    const diffDays = Math.ceil((proximaData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 5 && diffDays >= 0) {
      toast.error(`⚠️ Pagamento de ${nomeAluno} vence em ${diffDays} dia(s).`);
    } else if (diffDays < 0) {
      toast.error(`❗ Pagamento de ${nomeAluno} está atrasado!`);
    }
  };

  useEffect(() => {
    const init = async () => {
      await getClients();
    };
    init();
  }, []);

  useEffect(() => {
    if (clients.length > 0) {
      fetchPagamentos(clients);

      const intervalId = setInterval(() => {
        fetchPagamentos(clients);
      }, 30 * 60 * 1000); // 30 minutos

      return () => clearInterval(intervalId);
    }
  }, [clients]);

  return (
    <div className="p-4">
      <ToastContainer position="top-right" autoClose={6000} />
      <h1 className="text-xl sm:text-2xl font-semibold text-blue-700 mb-4">Lista de Alunos</h1>

      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-full bg-white divide-y divide-gray-200 text-sm">
          <thead className="bg-blue-100 text-blue-700 uppercase text-xs">
            <tr>
              <th className="px-4 py-2 text-left">Foto</th>
              <th className="px-4 py-2 text-left">Nome</th>
              <th className="px-4 py-2 text-left">Pagamento</th>
              <th className="px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((client) => {
              const pagamento = pagamentos[client._id];
              let status: JSX.Element | null = null;

              if (pagamento) {
                const ultimaData = new Date(pagamento.data);
                const proximaData = new Date(ultimaData);
                proximaData.setDate(ultimaData.getDate() + 30);

                const hoje = new Date();
                const diffDays = Math.ceil((proximaData.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
                const dataFormatada = proximaData.toLocaleDateString("pt-BR");

                if (diffDays > 5) {
                  status = <span className="text-green-600">✅ Em dia ({dataFormatada})</span>;
                } else if (diffDays >= 0) {
                  status = <span className="text-yellow-600">⏳ Vence em {diffDays} dia(s)</span>;
                } else {
                  status = <span className="text-red-600">❗ Atrasado ({dataFormatada})</span>;
                }
              }

              return (
                <tr key={client._id} className="hover:bg-blue-50">
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
                  <td className="px-4 py-2 text-gray-700">
                    {status ?? <span className="text-gray-400 italic">Sem pagamento</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Page;
