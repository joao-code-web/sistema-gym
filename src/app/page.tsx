"use client";

import axios from "axios";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FaArrowDown, FaArrowUp, FaMoneyBillWave } from "react-icons/fa";
import padrao from "../../public/padrão/PADRAO.png"

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { HiMiniBellAlert } from "react-icons/hi2";


interface MesesTypes {
  _id: string;
  data: Date;
}



interface PagamentoTypes {
  _id: string;
  client: string;
  valor: number;
  data: string;
}

interface DespesasTypes {
  _id: string;
  tipoGasto: string;
  valor: number;
  descricao: string;
  dataCriacao: Date;
}

export default function Home() {

  const [meses, setMeses] = useState<MesesTypes[]>([]);
  const [pagamentosPorMes, setPagamentosPorMes] = useState<Record<string, PagamentoTypes[]>>({});
  const [despesasPorMes, setDespesasPorMes] = useState<Record<string, DespesasTypes[]>>({});

  const [isFormMesVisible, setFormMesVisible] = useState(false);
  const [isFormAlunoVisible, setFormAlunoVisible] = useState(false);
  const [isUsesVerci, setIsUsesVerci] = useState(false);
  const [dataInput, setDataInput] = useState("");

  const [nomeAluno, setNomeAluno] = useState("");
  const [fotoAluno, setFotoAluno] = useState<File | null>(null);

  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [total, setTotal] = useState(0);

  const getMeses = async () => {
    try {
      const response = await axios.get("/api/Mes");
      setMeses(response.data.meses);
    } catch (error) {
      console.error("Erro ao buscar meses:", error);
    }
  };

  useEffect(() => {
    getMeses();


  }, []);

  const getPagamentosPorMes = useCallback(async () => {
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


      Object.values(pagamentosMap).forEach((pagamentos) => {
        if (Array.isArray(pagamentos)) {
          pagamentos.forEach((pagamento) => {
            if (pagamento && typeof pagamento.valor === "number") {
              if (pagamento.valor > 0) {
                totalEntradasTemp += pagamento.valor;
              }
            }
          });
        }
      });

      setTotalEntradas(totalEntradasTemp);

    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
    }
  }, [meses]);

  const getDespesasPorMes = useCallback(async () => {
    try {
      const despesasPromises = meses.map(async (mes) => {
        const response = await axios.get(`/api/Despesas`, {
          params: { idMes: mes._id },
        });
        return { mesId: mes._id, despesas: response.data };
      });

      const resultados = await Promise.all(despesasPromises);
      const despesasMap = resultados.reduce((acc, { mesId, despesas }) => {
        acc[mesId] = despesas;
        return acc;
      }, {} as Record<string, DespesasTypes[]>);

      setDespesasPorMes(despesasMap);

      let totalTemp = 0;

      Object.values(despesasMap).forEach((despesas) => {
        if (Array.isArray(despesas)) {
          despesas.forEach((despesa) => {
            if (despesa && typeof despesa.valor === "number") {
              totalTemp += despesa.valor;
            }
          });
        }
      });

      setTotalSaidas(totalTemp);
    } catch (error) {
      console.error("Erro ao buscar despesas:", error);
    }
  }, [meses]);

  const calcularSaldo = useCallback(() => {
    const saldo = totalEntradas - totalSaidas; // Subtração de entradas pelas saídas

    setTotal(saldo); // Atualiza o estado com o saldo
  }, [totalEntradas, totalSaidas]);

  useEffect(() => {
    if (meses.length > 0) {
      getPagamentosPorMes();
      getDespesasPorMes();
    }
  }, [meses, getPagamentosPorMes, getDespesasPorMes]);

  useEffect(() => {
    calcularSaldo(); // Chama a função para calcular o saldo
  }, [calcularSaldo]);


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


  const handleAlunoFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeAluno) {
      alert("Preencha todos os campos!");
      return;
    }

    const formData = new FormData();
    formData.append("nome", nomeAluno);

    // Verificar se uma foto foi enviada. Caso contrário, usar a imagem padrão.
    if (fotoAluno) {
      formData.append("image", fotoAluno);
    } else {
      // Carregar a imagem padrão
      const response = await fetch(padrao.src);
      const blob = await response.blob();
      const defaultFile = new File([blob], "padrão.png", { type: blob.type });
      formData.append("image", defaultFile);
    }

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

      <div className="absolute left-5 top-6 flex flex-col items-start">
        {/* Botão de notificação */}
        <div
          className="bg-white w-14 h-14 shadow-md rounded-full p-3 flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-110"
          onClick={() => {
            setIsUsesVerci(!isUsesVerci);
            if (isUsesVerci) setIsUsesVerci(false);
          }}
        >
          <HiMiniBellAlert size={30} className="text-blue-500" />
        </div>

        {/* Painel de notificações */}
        {isUsesVerci && (
          <div className="absolute left-0 top-20 bg-white shadow-2xl rounded-2xl w-96 border border-gray-300 p-6 transition-all duration-300 ease-in-out z-50">
            {/* Título */}
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              📅 Próximos Vencimentos
            </h3>

            {/* Lista de notificações */}
            <ul className="space-y-3">
              <li className="flex items-center gap-3 p-4 bg-blue-50 text-blue-900 rounded-lg shadow">
                <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                  🗓️
                </div>
                <div>
                  <p className="text-sm font-medium">GISELE - VENCIMENTO</p>
                  <p className="text-xs text-gray-500">PG: 15/01/2025</p>
                  <p className="text-xs text-gray-500">VC: 15/02/2025</p>
                </div>
              </li>

            </ul>


          </div>
        )}
      </div>


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
          <div className="bg-red-100 text-red-700 rounded-lg shadow-md p-4 w-full text-center flex flex-col items-center">
            <FaArrowDown className="text-3xl mb-2" />
            <h2 className="text-lg font-bold">Saiu</h2>
            <p className="text-xl font-semibold">
              {totalSaidas !== undefined ? `R$ ${Math.abs(totalSaidas).toFixed(2)}` : "Carregando..."}
            </p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 -z-50">
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
                        pagamentosPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor > 0 ? acc + Number(elemente.valor) : acc, 0).toFixed(2) :
                        'Nenhum pagamento registrado'
                      }
                    </span>
                  </span>
                </p>

                <p className="text-lg font-medium text-gray-800 mt-2">
                  <span className="text-red-600">
                    DESPESAS:{" "}
                    <span className={Array.isArray(despesasPorMes[mes._id]) ? "font-semibold" : "text-gray-500"}>
                      {Array.isArray(despesasPorMes[mes._id]) ? (
                        despesasPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor > 0 ? acc + Number(elemente.valor) : acc, 0).toFixed(2)
                      ) : 'Nenhuma despesa registrada'}
                    </span>

                  </span>
                </p>



                <p className="text-lg font-medium text-gray-800 mt-2">
                  <span className={`font-semibold ${Array.isArray(pagamentosPorMes[mes._id]) && pagamentosPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0) -
                    (Array.isArray(despesasPorMes[mes._id]) ? despesasPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0) : 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    CAIXA: {Array.isArray(pagamentosPorMes[mes._id]) && Array.isArray(despesasPorMes[mes._id]) ?
                      (pagamentosPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0) -
                        despesasPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0)).toFixed(2)
                      : 'Dados insuficientes'}
                  </span>
                </p>

                <p className="text-lg font-medium text-gray-800 mt-2">
                  <span className={`font-semibold ${Array.isArray(pagamentosPorMes[mes._id]) && pagamentosPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0) -
                    (Array.isArray(despesasPorMes[mes._id]) ? despesasPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0) : 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Capital de Giro (45%): {Array.isArray(pagamentosPorMes[mes._id]) && Array.isArray(despesasPorMes[mes._id]) ?
                      ((pagamentosPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0) -
                        despesasPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0)) * 0.45).toFixed(2)
                      : 'Dados insuficientes'}
                  </span>
                </p>

                <p className="text-lg font-medium text-gray-800 mt-2">
                  <span className={`font-semibold ${Array.isArray(pagamentosPorMes[mes._id]) && pagamentosPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0) -
                    (Array.isArray(despesasPorMes[mes._id]) ? despesasPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0) : 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Reserva de Emergência (30%): {Array.isArray(pagamentosPorMes[mes._id]) && Array.isArray(despesasPorMes[mes._id]) ?
                      ((pagamentosPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0) -
                        despesasPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0)) * 0.30).toFixed(2)
                      : 'Dados insuficientes'}
                  </span>
                </p>

                <p className="text-lg font-medium text-gray-800 mt-2">
                  <span className={`font-semibold ${Array.isArray(pagamentosPorMes[mes._id]) && pagamentosPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0) -
                    (Array.isArray(despesasPorMes[mes._id]) ? despesasPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0) : 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    Reserva para Expansão (25%): {Array.isArray(pagamentosPorMes[mes._id]) && Array.isArray(despesasPorMes[mes._id]) ?
                      ((pagamentosPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0) -
                        despesasPorMes[mes._id]?.reduce((acc, elemente) => elemente.valor ? acc + Number(elemente.valor) : acc, 0)) * 0.25).toFixed(2)
                      : 'Dados insuficientes'}
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
