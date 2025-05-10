"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";

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

  // Solicitar permissão para notificações
  const requestNotificationPermission = () => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          console.log("Permissão para notificações concedida.");
        }
      });
    }
  };

  // Buscar clientes
  const getClients = async () => {
    try {
      const response = (await axios.get(`/api/Client`)).data;
      setClients(response);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  };

  // Buscar último pagamento por aluno
  const getUltimoPagamentoPorCliente = async (clientId: string) => {
    try {
      const response = await axios.get(`/api/Pagamentos?idClient=${clientId}`);
      const pagamentosDoAluno = response.data;

      if (pagamentosDoAluno.length > 0) {
        pagamentosDoAluno.sort(
          (a: Pagamento, b: Pagamento) =>
            new Date(b.data).getTime() - new Date(a.data).getTime()
        );
        return pagamentosDoAluno[0]; // Último pagamento
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Erro ao buscar pagamentos do aluno ${clientId}:`, error);
      return null;
    }
  };

  // Buscar pagamentos de todos os alunos
  const fetchPagamentos = async (clientes: ClientTypes[]) => {
    const resultado: Record<string, Pagamento | null> = {};
    await Promise.all(
      clientes.map(async (client) => {
        const ultimo = await getUltimoPagamentoPorCliente(client._id);
        resultado[client._id] = ultimo;

        // Verifica se precisa enviar uma notificação
        if (ultimo) {
          checkAndNotify(ultimo, client.nome);
        }
      })
    );
    setPagamentos(resultado);
  };

  // Função que verifica o próximo pagamento e envia uma notificação
  const checkAndNotify = (ultimoPagamento: Pagamento, nomeAluno: string) => {
    const ultimaData = new Date(ultimoPagamento.data);
    const proximaData = new Date(ultimaData);
    proximaData.setDate(ultimaData.getDate() + 30);

    const hoje = new Date();
    const diffTime = proximaData.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Se o pagamento estiver atrasado ou vencer em menos de 5 dias, mostra a notificação
    if (diffDays <= 5 && diffDays >= 0) {
      showBrowserNotification(`Pagamento de ${nomeAluno} vence em ${diffDays} dia(s).`);
    } else if (diffDays < 0) {
      showBrowserNotification(`Pagamento de ${nomeAluno} está atrasado!`);
    }
  };

  // Função que exibe a notificação no navegador
  const showBrowserNotification = (message: string) => {
    if (Notification.permission === "granted") {
      new Notification(message);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      await getClients();
      requestNotificationPermission(); // Solicita permissão ao carregar a página
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (clients.length > 0) {
      fetchPagamentos(clients);

      // Verificação a cada 30 minutos
      const intervalId = setInterval(() => {
        fetchPagamentos(clients);
      }, 30 * 60 * 1000); // 30 minutos em milissegundos

      return () => clearInterval(intervalId); // Limpa o intervalo quando o componente for desmontado
    }
  }, [clients]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-blue-700 mb-4">Lista de Alunos</h1>
      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200 bg-white">
          <thead className="bg-blue-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                Foto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                Nome
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                Pagamento
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                Status Próximo Pagamento
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.map((client) => (
              <tr key={client._id} className="hover:bg-blue-50 transition">
                <td className="px-6 py-4">
                  <img
                    src={client.image}
                    alt={client.nome}
                    className="h-12 w-12 rounded-full object-cover border border-blue-200"
                  />
                </td>
                <td className="px-6 py-4 text-sm text-gray-800">{client.nome}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {pagamentos[client._id] ? (
                    <>
                      <div>
                        Último:{" "}
                        {new Date(pagamentos[client._id]!.data).toLocaleDateString("pt-BR")}
                      </div>
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Sem registro</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {pagamentos[client._id] ? (
                    <>
                      {(() => {
                        const ultimaData = new Date(pagamentos[client._id]!.data);
                        const proximaData = new Date(ultimaData);
                        proximaData.setDate(ultimaData.getDate() + 30);

                        const hoje = new Date();
                        const diffTime = proximaData.getTime() - hoje.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                        const dataFormatada = proximaData.toLocaleDateString("pt-BR");

                        if (diffDays > 5) {
                          return (
                            <span className="text-green-600">Em dia ({dataFormatada})</span>
                          );
                        } else if (diffDays >= 0) {
                          return (
                            <span className="text-yellow-600">⏳ Vence em {diffDays} dia(s)</span>
                          );
                        } else {
                          return (
                            <span className="text-red-600">❗ Atrasado ({dataFormatada})</span>
                          );
                        }
                      })()}
                    </>
                  ) : (
                    <span className="text-gray-400 italic">Sem pagamento</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Page;
