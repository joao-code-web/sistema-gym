"use client";

import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";

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

export default function PageClient({ id }: { id: string })  {
    const [client, setClient] = useState<ClientTypes | null>(null);
    const [pagamentos, setPagamentos] = useState<PagamentoTypes[]>([]);

    const getClient = useCallback(async () => {
        try {
            const { data } = await axios.get(`/api/Client?id=${id}`);
            setClient(data);
        } catch (error) {
            console.error(error);
        }
    }, [id]);

    const getPagamentosClient = useCallback(async () => {
        try {
            const { data } = await axios.get(`/api/Pagamentos?idClient=${id}`);
            setPagamentos(data);
        } catch (error) {
            console.error(error);
        }
    }, [id]);

    useEffect(() => {
        getClient();
        getPagamentosClient();
    }, [getClient, getPagamentosClient]);

    const totalPagamentos = Array.isArray(pagamentos)
        ? pagamentos.reduce((total, ele) => total + ele.valor, 0)
        : 0;

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-gray-800 text-gray-100">
            {client ? (
                <div className="rounded-lg p-6 max-w-md w-full bg-white shadow-lg transform transition duration-300 hover:scale-105">
                    <div className="flex flex-col items-center">
                        <Image
                            src={client.image}
                            alt={client.nome}
                            className="w-24 h-24 rounded-full shadow-md mb-4 border-4 border-blue-500"
                            width={200}
                            height={200}
                        />
                        <h1 className="text-2xl font-bold text-gray-800">{client.nome}</h1>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center">
                    <p className="text-lg font-medium text-gray-300 animate-pulse">
                        Carregando...
                    </p>
                </div>
            )}
            <div className="bg-gray-700 max-w-md w-full mt-4 p-4 rounded-md shadow-md text-lg text-gray-100">
                <p className="font-semibold">Total dos Pagamentos:</p>
                <p
                    className={`text-2xl font-bold ${totalPagamentos >= 0 ? "text-green-400" : "text-red-500"
                        }`}
                >
                    R$ {totalPagamentos.toFixed(2)}
                </p>
            </div>
            <div className="mt-8 w-full max-w-lg">
                <h2 className="text-lg font-semibold text-gray-200 mb-4">
                    Histórico de Pagamentos
                </h2>
                <div className="bg-gray-800 rounded-lg p-4 shadow-md space-y-4">
                    {Array.isArray(pagamentos) && pagamentos.length > 0 ? (
                        pagamentos.map((ele) => (
                            <div
                                key={ele._id}
                                className={`flex justify-between items-center bg-gray-700 p-3 rounded-md shadow ${ele.valor < 0 ? "text-red-400" : "text-green-400"
                                    }`}
                            >
                                <div className="text-sm">
                                    <p className="font-medium text-gray-100">
                                        Data:{" "}
                                        {format(new Date(ele.data), "dd 'de' MMMM 'de' yyyy", {
                                            locale: ptBR,
                                        })}
                                    </p>
                                    <p className="text-gray-400">Valor: {ele.valor}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-400">
                            Nenhum pagamento encontrado.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
