"use client";

import axios from "axios";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaArrowDown, FaArrowUp, FaMoneyBillWave } from "react-icons/fa";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale"; // Para suporte ao português (Brasil)


interface MesesTypes {
  _id: string;
  data: Date;
}

interface ClientTypes {
  _id: string;
  nome: string;
  image: string;
}


interface PagamentoTypes {
  _id: string;
  client: string;
  valor: number;
  data: string;
}

export default function Home() {
  // Estados
  const [clients, setClients] = useState<ClientTypes[]>([]);
  const [meses, setMeses] = useState<MesesTypes[]>([]);
  const [pagamentosPorMes, setPagamentosPorMes] = useState<Record<string, PagamentoTypes[]>>({});
  const [isFormMesVisible, setFormMesVisible] = useState(false);
  const [isFormAlunoVisible, setFormAlunoVisible] = useState(false);
  const [dataInput, setDataInput] = useState("");

  // Estados para o formulário de aluno
  const [nomeAluno, setNomeAluno] = useState("");
  const [fotoAluno, setFotoAluno] = useState<File | null>(null);

  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [total, setTotal] = useState(0);


  const mesesNomes = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Função para buscar meses
  const getMeses = async () => {
    try {
      const response = await axios.get("/api/Mes");
      setMeses(response.data.meses);
    } catch (error) {
      console.error("Erro ao buscar meses:", error);
    }
  };

  const getPagamentosPorMes = async () => {
    try {
      const pagamentosPromises = meses.map(async (mes) => {
        const response = await axios.get(`/api/Pagamentos`, {
          params: { idMes: mes._id },
        });
        return { mesId: mes._id, pagamentos: response.data };
      });

      const resultados = await Promise.all(pagamentosPromises);
      const pagamentosMap = resultados.reduce((acc, { mesId, pagamentos }) => {
        acc[mesId] = pagamentos;
        return acc;
      }, {} as Record<string, PagamentoTypes[]>);

      setPagamentosPorMes(pagamentosMap);

      // Calcular os totais de entrada e saída
      let totalEntradasTemp = 0;
      let totalSaidasTemp = 0;
      let total = 0;

      Object.values(pagamentosMap).forEach((pagamentos) => {
        if (Array.isArray(pagamentos)) { // Verifica se 'pagamentos' é um array
          pagamentos.forEach((pagamento) => {
            if (pagamento && typeof pagamento.valor === 'number') { // Valida se 'pagamento.valor' é um número
              if (pagamento.valor > 0) {
                totalEntradasTemp += pagamento.valor; // Soma os valores positivos às entradas
              } else {
                totalSaidasTemp += pagamento.valor; // Soma os valores negativos às saídas
              }
            }
            total = totalEntradasTemp + totalSaidasTemp
          });
        }
      });




      setTotalEntradas(totalEntradasTemp);
      setTotalSaidas(totalSaidasTemp);
      setTotal(total);
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
    }
  };


  // useEffect para buscar meses
  useEffect(() => {
    getMeses();

  }, []);

  // useEffect para buscar pagamentos sempre que os meses forem atualizados
  useEffect(() => {
    if (meses.length > 0) {
      getPagamentosPorMes();

    }
  }, [meses]);

  // Submissão do formulário para adicionar mês
  const handleMesFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/Mes", { data: dataInput });
      getMeses();
      setDataInput("");
      setFormMesVisible(false);
    } catch (error) {
      console.error("Erro ao adicionar mês:", error);
    }
  };

  // Submissão do formulário para cadastrar aluno
  const handleAlunoFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeAluno || !fotoAluno) {
      alert("Preencha todos os campos!");
      return;
    }

    const formData = new FormData();
    formData.append("nome", nomeAluno);
    formData.append("image", fotoAluno);

    try {
      await axios.post("/api/Client", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Aluno cadastrado com sucesso!");
      setNomeAluno("");
      setFotoAluno(null);
      setFormAlunoVisible(false);
    } catch (error) {
      console.error("Erro ao cadastrar aluno:", error);
      alert("Erro ao cadastrar aluno.");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
        CONTROLE DE CLIENTES E FINANCEIRO
      </h1>

      <div className="flex flex-col as w-1/2 m-auto items-center gap-4 mb-6">
        {/* Linha superior com Entradas e Saídas */}
        <div className="flex justify-center w-full gap-4">
          {/* Caixa de Entradas */}
          <div className="bg-green-100 w-full text-green-700 rounded-lg shadow-md p-4  text-center flex flex-col items-center">
            <FaArrowUp className="text-3xl mb-2" />
            <h2 className="text-lg font-bold">Entrou</h2>
            <p className="text-xl font-semibold">R$ {totalEntradas.toFixed(2)}</p>
          </div>

          {/* Caixa de Saídas */}
          <div className="bg-red-100   text-red-700 rounded-lg shadow-md p-4 w-full text-center flex flex-col items-center">
            <FaArrowDown className="text-3xl mb-2" />
            <h2 className="text-lg font-bold">Saiu</h2>
            <p className="text-xl font-semibold">R$ {Math.abs(totalSaidas).toFixed(2)}</p>
          </div>
        </div>

        {/* Total embaixo */}
        <div
          className={`${total >= 0
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
            } rounded-lg shadow-md p-4 w-full text-center flex flex-col items-center`}
        >
          <FaMoneyBillWave className="text-3xl mb-2" />
          <h2 className="text-lg font-bold">CAIXA</h2>
          <p className="text-xl font-semibold">R$ {Math.abs(total).toFixed(2)}</p>
        </div>
      </div>



      <div className="flex flex-col items-center my-8">
        <div className="flex ab gap-4">
          <button
            className="flex items-center justify-center px-6 py-3 text-white bg-blue-500 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all"
            onClick={() => {
              setFormMesVisible(!isFormMesVisible);
              if (isFormAlunoVisible) setFormAlunoVisible(false);
            }}
          >
            Adicionar Mês
          </button>

          <button
            className="flex items-center justify-center px-6 py-3 text-white bg-blue-500 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all"
            onClick={() => {
              setFormAlunoVisible(!isFormAlunoVisible);
              if (isFormMesVisible) setFormMesVisible(false);
            }}
          >
            Adicionar Aluno
          </button>

          <Link href={`/pages/clients/`}>
            <button
              className="flex items-center justify-center px-6 py-3 text-white bg-blue-500 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all">
              Ver Alunos
            </button>
          </Link>
        </div>
      </div>

      {isFormAlunoVisible && (
        <div className="p-6 flex flex-col items-center justify-center">
          <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
            <h1 className="text-2xl font-bold text-blue-600 mb-6 text-center">
              Cadastrar Novo Aluno
            </h1>
            <form onSubmit={handleAlunoFormSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                placeholder="Nome"
                value={nomeAluno}
                onChange={(e) => setNomeAluno(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="file"
                onChange={(e) => {
                  if (e.target.files) {
                    setFotoAluno(e.target.files[0]);
                  }
                }}
                className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                className="bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 transition duration-300"
              >
                Cadastrar
              </button>
            </form>
          </div>
        </div>
      )}

      {isFormMesVisible && (
        <form
          onSubmit={handleMesFormSubmit}
          className="flex items-center justify-center gap-4 p-4"
        >
          <input
            type="date"
            value={dataInput}
            onChange={(e) => setDataInput(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 text-white bg-blue-500 rounded-md shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Adicionar Mês
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {meses.map((mes) => (
          <Link href={`/pages/${mes._id}`} key={mes._id}>
            <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105">
              <p className="text-xl font-semibold text-gray-900">
                Data: <span className="text-blue-700">{format(new Date(mes.data), "MMMM 'de' yyyy", { locale: ptBR }).replace(/^[a-zá-ú]/,
                  (char) => char.toUpperCase())}</span>
              </p>

              <div className="mt-4">
                <p className="text-lg font-medium text-gray-800">
                  <span className="text-green-600">
                    ENTROU:{" "}
                    <span className={Array.isArray(pagamentosPorMes[mes._id]) ? "font-semibold" : "text-gray-500"}>
                      {Array.isArray(pagamentosPorMes[mes._id]) ?
                        pagamentosPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor > 0 ? acc + Number(elemente.valor) : acc, 0).toString() :
                        'Nenhum pagamento registrado'
                      }
                    </span>
                  </span>
                </p>

                <p className="text-lg font-medium text-gray-800 mt-2">
                  <span className="text-red-600">
                    SAIU:{" "}
                    <span className={Array.isArray(pagamentosPorMes[mes._id]) ? "font-semibold" : "text-gray-500"}>
                      {Array.isArray(pagamentosPorMes[mes._id]) ?
                        pagamentosPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor < 0 ? acc + Number(elemente.valor) : acc, 0).toString() :
                        'Nenhum pagamento registrado'
                      }
                    </span>
                  </span>
                </p>

                <p className="text-lg font-medium text-gray-800 mt-2">
                  <span className={`font-semibold ${Array.isArray(pagamentosPorMes[mes._id]) &&
                    pagamentosPorMes[mes._id]?.reduce((acc, elemente) =>
                      elemente.valor ? acc + Number(elemente.valor) : acc, 0) > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                    }`}>
                    CAIXA: {
                      Array.isArray(pagamentosPorMes[mes._id]) ?
                        pagamentosPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0).toString() :
                        'Nenhum pagamento registrado'
                    }
                  </span>
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

    </div>
  );
}
