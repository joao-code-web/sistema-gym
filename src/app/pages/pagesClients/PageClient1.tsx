"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { IoPeopleSharp } from "react-icons/io5";
import Image from "next/image";
import { FaArrowDown, FaArrowUp, FaMoneyBillWave } from "react-icons/fa";

interface MesesTypes {
    _id: string;
    data: string;
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

interface DespesasTypes {
    _id: string;
    tipoGasto: string;
    valor: number;
    descricao: string;
    dataCriacao: Date;
}

export default function PageClient({ id }: { id: string }) {
    const [mes, setMes] = useState<MesesTypes | null>(null);
    const [clients, setClients] = useState<ClientTypes[]>([]);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [valor, setValor] = useState<number>(50);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isDropdownVisible, setIsDropdownVisible] = useState<boolean>(false);
    const [pagamentos, setPagamentos] = useState<PagamentoTypes[]>([]);
    const [isFormAlunoVisible, setIsFormAlunoVisible] = useState(false);
    const [isPagamentoAlunoVisible, setIsPagamentoAlunoVisible] = useState(false);
    const [tipoGasto, setTipoGasto] = useState("");
    const [valorPagamento, setValorPagamento] = useState(50);
    const [descricao, setDescricao] = useState("");
    const [despesas, setDespesas] = useState<DespesasTypes[]>([]);

    const [totalEntradas, setTotalEntradas] = useState(0);
    const [totalSaidas, setTotalSaidas] = useState(0);
    const [total, setTotal] = useState(0);

    const mesesNomes = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];



    const getMesId = async (id: string) => {
        try {
            const response = await axios.get(`/api/Mes?id=${id}`);
            setMes(response.data.meses);

        } catch (error) {
            console.error("Erro ao buscar o mês:", error);
        }
    };

    const getClients = async () => {
        try {
            const response = await axios.get(`/api/Client`);
            setClients(response.data);

        } catch (error) {
            console.error("Erro ao buscar os clientes:", error);
        }
    };

    const getPagamentos = useCallback(async () => {
        try {
            const response = await axios.get(`/api/Pagamentos?idMes=${id}`);
            setPagamentos(response.data);

        } catch (error) {
            console.error('Erro ao buscar os pagamentos:', error);
        }
    }, [id]);

    const getDespesas = async (id: string) => {
        try {
            const response = await axios.get(`/api/Despesas?id=${id}`);
            setDespesas(response.data);

        } catch (error) {
            console.log(error);
        }
    };

    const calcularTotais = useCallback(() => {


        const totalEntradasCalculado = Array.isArray(pagamentos)
            ? pagamentos.reduce((acc, pagamentos) => acc + Number(pagamentos.valor), 0)
            : 0;

        const totalSaidasCalculado = Array.isArray(despesas)
            ? despesas.reduce((acc, despesa) => acc + Number(despesa.valor), 0)
            : 0;

        const saldoCalculado = totalEntradasCalculado - totalSaidasCalculado;

        setTotalEntradas(totalEntradasCalculado);
        setTotalSaidas(totalSaidasCalculado);
        setTotal(saldoCalculado);
    }, [pagamentos, despesas]);

    useEffect(() => {
        getMesId(id);
        getClients();
        getPagamentos();
        getDespesas(id);

    }, [id, getPagamentos]);

    useEffect(() => {
        calcularTotais();
    }, [calcularTotais]);




    const deletePagamentos = async (idPagamento: string, idClient: string,) => {
        try {
            const confirm = window.confirm("Deseja excluir esse pagamento?")
            if (!confirm) return;
            await axios.delete(`/api/Pagamentos`, {
                params: { idPagamento: idPagamento, idClient: idClient }
            })
            getPagamentos();

        } catch (error) {
            console.log(error)
        }
    }

    const editarPagamentos = async (idPagamento: string, idClient: string) => {
        try {
            // Solicitar o novo valor e a nova data ao usuário
            const novoValor = window.prompt("Digite o novo valor do pagamento:", "50");

            // Criar um input de data para o usuário escolher a data
            const novaData = window.prompt("Digite a nova data do pagamento (formato: YYYY-MM-DD):", "2025-01-21");

            // Verificar se a data está no formato correto
            if (!novaData || !/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
                alert("Por favor, insira uma data válida no formato YYYY-MM-DD.");
                return;
            }

            // Manipular a data para evitar problemas de fuso horário
            const [year, month, day] = novaData.split('-');
            const data = new Date(Number(year), Number(month) - 1, Number(day));

            // Ajustar a hora para evitar deslocamento de fuso horário
            data.setHours(0, 0, 0, 0); // Garantir que a hora seja 00:00:00

            // Fazer a requisição PUT para a API
            await axios.put(`/api/Pagamentos`, {
                idPagamento,
                idClient,
                valor: Number(novoValor),
                data: data.toISOString(), // Enviar a data como string no formato ISO
            });

            alert("Pagamento editado com sucesso!");
            getPagamentos();

        } catch (error) {
            console.error("Erro ao editar o pagamento:", error);
            alert("Ocorreu um erro ao editar o pagamento.");
        }
    };

    const deleteDespesas = async (idDespesa: string) => {
        try {
            const confirm = window.confirm("Deseja excluir esse pagamento?")
            if (!confirm) return;
            await axios.delete(`/api/Despesas`, {
                params: { idDespesa: idDespesa }
            })
            getDespesas(id);

        } catch (error) {
            console.log(error)
        }
    }

    const editarDespesas = async (idDespesa: string) => {
        try {
            // Solicitar os novos valores
            const novoValor = window.prompt("Digite o novo valor do pagamento:", "50");
            if (!novoValor || isNaN(Number(novoValor))) {
                alert("Por favor, insira um valor válido.");
                return;
            }

            const novaData = window.prompt("Digite a nova data do pagamento (formato: YYYY-MM-DD):", "2025-01-21");
            if (!novaData || !/^\d{4}-\d{2}-\d{2}$/.test(novaData)) {
                alert("Por favor, insira uma data válida no formato YYYY-MM-DD.");
                return;
            }

            // Opções de tipo de gasto
            const tiposPermitidos = [
                "Fixo",
                "Variavel",
                "Ocasional",
                "Emergencia",
                "Supérfluo",
                "Investimento",
            ];

            // Criar uma lista simples para escolha do tipo de gasto
            const novoTipoGasto = window.prompt(
                `Escolha o novo tipo de gasto digitando uma das opções abaixo:\n${tiposPermitidos.join(", ")}`,
                "Variavel"
            );

            if (!novoTipoGasto || !tiposPermitidos.includes(novoTipoGasto)) {
                alert("Por favor, escolha um tipo de gasto válido.");
                return;
            }

            const novaDescricao = window.prompt("Digite a nova descrição:");
            if (!novaDescricao || novaDescricao.trim() === "") {
                alert("Por favor, insira uma descrição válida.");
                return;
            }

            // Manipular a data para evitar problemas de fuso horário
            const [year, month, day] = novaData.split("-");
            const data = new Date(Number(year), Number(month) - 1, Number(day));
            data.setHours(0, 0, 0, 0);

            // Fazer a requisição PUT para a API
            await axios.put(`/api/Despesas`, {
                idDespesa,
                tipoGasto: novoTipoGasto, // Usar o valor diretamente
                valor: novoValor,
                descricao: novaDescricao,
                data: data.toISOString(),
            });

            alert("Pagamento editado com sucesso!");
            getDespesas(idDespesa);

        } catch (error) {
            console.error("Erro ao editar o pagamento:", error);
            alert("Ocorreu um erro ao editar o pagamento.");
        }
    };


    const filteredClients = clients.filter((client) =>
        client.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleClientSelect = (client: ClientTypes) => {
        setSearchQuery(client.nome); // Preenche o input com o nome do cliente
        setSelectedClient(client._id); // Define o cliente selecionado
        setIsDropdownVisible(false); // Oculta o dropdown de opções
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedClient && valor) {
            try {
                await axios.post(
                    `/api/Pagamentos?id=${selectedClient}&idMes=${id}`,
                    { valor: valor }
                );
                alert("Pagamento registrado com sucesso!");
                getPagamentos(); // Atualiza a lista de pagamentos

            } catch (error) {
                console.error("Erro ao registrar o pagamento:", error);
                alert("Ocorreu um erro ao registrar o pagamento.");
            }
        } else {
            alert("Preencha todos os campos!");
        }
    };

    const handleSubmitDespesa = async (e: React.FormEvent) => {
        e.preventDefault();

        const novaDespesa = {
            tipoGasto,
            valor,
            descricao,
            data: new Date().toISOString(), // Data atual

        };



        try {
            const response = await axios.post(`/api/Despesas?idMes=${id}`, novaDespesa);

            console.log("Despesa cadastrada com sucesso:", response.data);
            alert("Despesa cadastrada com sucesso!");

            // Resetar os campos
            setTipoGasto("");
            setValorPagamento(50);
            setDescricao("");
            getDespesas(id);

        } catch {
            alert('algo mal -ivan angola')
        }
    };




    return (
        <div className="p-6 flex flex-col items-center justify-center">
            <h1 className="text-3xl font-bold text-blue-600 mb-3">Detalhes do Mês</h1>



            {mes ? (
                <div className="rounded-lg p-2 max-w-md w-full text-center">
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-2xl font-semibold text-gray-900">
                            {mesesNomes[new Date(mes.data).getMonth()]} de{" "}
                            {new Date(mes.data).getFullYear()}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center">
                    <p className="text-lg font-medium text-gray-600">Carregando...</p>
                </div>
            )}

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

            <div className="flex flex-col as w-1/2 m-auto items-center gap-4 mb-6">
                {/* Linha superior com Entradas e Saídas */}
                <div className="flex justify-center w-full gap-4">
                    {/* Caixa de Entradas */}
                    <div className="bg-green-100 w-full text-green-700 rounded-lg shadow-md p-4  text-center flex flex-col items-center">
                        <IoPeopleSharp className="text-3xl mb-2" />
                        <h2 className="text-lg font-bold">QUANTIDADE</h2>
                        <p className="text-xl font-semibold">
                            {Array.isArray(pagamentos) ? pagamentos.filter(pagamento => pagamento.valor > 0).length : 0}
                        </p>


                    </div>
                </div>
            </div>

            <div className="flex justify-evenly w-1/2 items-center flex-wrap gap-4">
                <button onClick={() => {
                    setIsFormAlunoVisible(!isFormAlunoVisible);
                    setIsPagamentoAlunoVisible(false);
                    if (isFormAlunoVisible) setIsFormAlunoVisible(false);
                }} className="px-4 py-2 text-white bg-blue-500 rounded-md shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >Adicionar Pagamento Aluno</button>

                <button onClick={() => {
                    setIsPagamentoAlunoVisible(!isPagamentoAlunoVisible);
                    setIsFormAlunoVisible(false);
                    if (isPagamentoAlunoVisible) setIsPagamentoAlunoVisible(false);
                }} className="px-4 py-2 text-white bg-red-500 rounded-md shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >adicionar Pagamento</button>

            </div>

            {isFormAlunoVisible && (
                <form onSubmit={handleSubmit} className="w-full max-w-md mt-6">
                    <div className="mb-4 relative">
                        <label htmlFor="search" className="block text-lg font-medium text-gray-700">
                            Pesquisar Cliente
                        </label>
                        <input
                            id="search"
                            type="text"
                            className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="Digite o nome do cliente"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setIsDropdownVisible(true)} // Exibe o dropdown ao focar no campo
                        />

                        {isDropdownVisible && searchQuery && filteredClients.length > 0 && (
                            <ul className="absolute left-0 w-full mt-2 bg-white border border-gray-300 rounded-md max-h-60 overflow-y-auto z-10 shadow-lg">
                                {filteredClients.map((client) => (
                                    <li
                                        key={client._id}
                                        className="p-2 cursor-pointer hover:bg-blue-100 transition-all"
                                        onClick={() => handleClientSelect(client)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Image
                                                src={client.image}
                                                alt={client.nome}
                                                className="w-8 h-8 rounded-full object-cover"
                                                width={300}
                                                height={200}
                                            />
                                            <span>{client.nome}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}

                        {searchQuery && filteredClients.length === 0 && (
                            <p className="absolute left-0 w-full mt-2 bg-white border border-gray-300 rounded-md p-2 text-gray-500 text-center">
                                Nenhum cliente encontrado.
                            </p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label htmlFor="valor" className="block text-lg font-medium text-gray-700">
                            Valor
                        </label>
                        <input
                            id="valor"
                            type="text"
                            className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                            value={valor}
                            onChange={(e) => setValor(Number(e.target.value))}
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-all"
                    >
                        Enviar
                    </button>
                </form>
            )}

            {isPagamentoAlunoVisible && (
                <form onSubmit={handleSubmitDespesa} className="w-full max-w-md mt-6">
                    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Controle de Pagamentos</h2>

                    {/* Tipo de Gasto */}
                    <div className="mb-4">
                        <label htmlFor="tipoGasto" className="block text-lg font-medium text-gray-700">
                            Tipo de Gasto
                        </label>
                        <select
                            id="tipoGasto"
                            className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                            value={tipoGasto}
                            onChange={(e) => setTipoGasto(e.target.value)}
                            required
                        >
                            <option value="" disabled>
                                Selecione o tipo de gasto
                            </option>
                            <option value="Fixo">Fixo</option>
                            <option value="Variavel">Variável</option>
                            <option value="Ocasional">Ocasionais</option>
                            <option value="Emergencia">Emergência</option>
                            <option value="Supérfluo">Supérfluos</option>
                            <option value="Investimento">Investimento</option>
                        </select>

                    </div>

                    {/* Valor */}
                    <div className="mb-4">
                        <label htmlFor="valor" className="block text-lg font-medium text-gray-700">
                            Valor (R$)
                        </label>
                        <input
                            id="valor"
                            type="number"
                            step="0.01"
                            className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="Digite o valor"
                            value={valorPagamento}
                            onChange={(e) => setValorPagamento(Number(e.target.value))}
                            required
                        />
                    </div>

                    {/* Descrição */}
                    <div className="mb-4">
                        <label htmlFor="descricao" className="block text-lg font-medium text-gray-700">
                            Descrição
                        </label>
                        <textarea
                            id="descricao"
                            className="mt-2 p-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
                            placeholder="Digite uma descrição do gasto"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            rows={3}
                        ></textarea>
                    </div>

                    {/* Botão Enviar */}
                    <button
                        type="submit"
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-all"
                    >
                        Registrar Pagamento
                    </button>
                </form>

            )}


            <div className="mt-8 w-full bg-white shadow-lg rounded-lg overflow-hidden">
                {pagamentos && pagamentos.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto border-collapse">
                            <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xl font-bold tracking-wide border-b border-gray-300">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-4 text-left text-xl font-bold tracking-wide border-b border-gray-300">
                                        Valor
                                    </th>
                                    <th className="px-6 py-4 text-left text-xl font-bold tracking-wide border-b border-gray-300">
                                        Data
                                    </th>
                                    <th className="px-6 py-4 text-center text-xl font-bold tracking-wide border-b border-gray-300">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagamentos.map((pagamento, index) => {
                                    const client = clients.find(c => c._id === pagamento.client);
                                    const isEven = index % 2 === 0;
                                    return (
                                        <tr
                                            key={pagamento._id}
                                            className={`${isEven ? "bg-gray-50" : "bg-white"
                                                } hover:bg-blue-50 transition-all`}
                                        >
                                            <td className="px-6 py-4 text-lg font-medium text-gray-800 border-b border-gray-300">
                                                <div className="flex items-center gap-3">
                                                    <Image
                                                        src={client ? client.image : '/default-avatar.png'}
                                                        alt={client ? client.nome : 'Imagem não disponível'}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                                                        width={300}
                                                        height={200}
                                                    />
                                                    <span className="text-lg font-semibold">
                                                        {client ? client.nome : 'Cliente não encontrado'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-lg font-medium text-gray-800 border-b border-gray-300">
                                                R$ {Number(pagamento.valor).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-lg font-medium text-gray-800 border-b border-gray-300">
                                                {new Date(pagamento.data).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center border-b border-gray-300">
                                                <div className="flex justify-center gap-4">
                                                    <button
                                                        onClick={() => deletePagamentos(pagamento._id, pagamento.client)}
                                                        className="bg-red-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-700 transition-all transform hover:scale-105"
                                                    >
                                                        Deletar
                                                    </button>

                                                    <button
                                                        onClick={() => editarPagamentos(pagamento._id, pagamento.client)}
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 transition-all transform hover:scale-105"
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-lg text-gray-600">
                        Nenhum pagamento registrado.
                    </div>
                )}
            </div>


            <div className="mt-8 w-full bg-white shadow-lg rounded-lg overflow-hidden">
                {despesas && despesas.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto border-collapse">
                            <thead className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xl font-bold tracking-wide border-b border-gray-300">
                                        Descrição
                                    </th>
                                    <th className="px-6 py-4 text-left text-xl font-bold tracking-wide border-b border-gray-300">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-4 text-left text-xl font-bold tracking-wide border-b border-gray-300">
                                        Valor
                                    </th>
                                    <th className="px-6 py-4 text-left text-xl font-bold tracking-wide border-b border-gray-300">
                                        Data
                                    </th>
                                    <th className="px-6 py-4 text-center text-xl font-bold tracking-wide border-b border-gray-300">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {despesas.map((despesa) => {

                                    return (
                                        <tr
                                            key={despesa._id}
                                            className={` hover:bg-blue-50 transition-all`}
                                        >
                                            <td className="px-6 py-4 text-lg font-medium text-gray-800 border-b border-gray-300">
                                                <span className="text-lg font-semibold">
                                                    {despesa ? despesa.descricao : 'Cliente não encontrado'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-lg font-medium text-gray-800 border-b border-gray-300">
                                                {despesa.tipoGasto}
                                            </td>
                                            <td className="px-6 py-4 text-lg font-medium text-gray-800 border-b border-gray-300">
                                                R$ -{Number(despesa.valor).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-lg font-medium text-gray-800 border-b border-gray-300">
                                                {new Date(despesa.dataCriacao).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center border-b border-gray-300">
                                                <div className="flex justify-center gap-4">
                                                    <button
                                                        onClick={() => deleteDespesas(despesa._id)}
                                                        className="bg-red-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-red-700 transition-all transform hover:scale-105"
                                                    >
                                                        Deletar
                                                    </button>

                                                    <button
                                                        onClick={() => editarDespesas(despesa._id)}
                                                        className="bg-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:bg-blue-700 transition-all transform hover:scale-105"
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-lg text-gray-600">
                        Nenhum pagamento registrado.
                    </div>
                )}
            </div>



        </div>
    );
}
