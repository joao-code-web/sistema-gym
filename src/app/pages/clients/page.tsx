"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";

import padrao from "../../../../public/padrão/PADRAO.png"

interface ClientTypes {
    _id: string;
    nome: string;
    image: string;
}

export default function PageClient() {
    const [clients, setClients] = useState<ClientTypes[]>([]);
    const [filteredClients, setFilteredClients] = useState<ClientTypes[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [isFormAlunoVisible, setFormAlunoVisible] = useState(false);
    const [nomeAluno, setNomeAluno] = useState("");
    const [fotoAluno, setFotoAluno] = useState<File | null>(null);

    const [editingClient, setEditingClient] = useState<ClientTypes | null>(null);

    // Função para buscar os clientes
    const getClients = async () => {
        try {
            const response = (await axios.get(`/api/Client`)).data;
            setClients(response);
            setFilteredClients(response);
        } catch (error) {
            console.error("Erro ao buscar clientes:", error);
        }
    };

    const deleteClient = async (id: string, nome: string) => {
        try {
            const confirmation = window.confirm(`Tem certeza que deseja excluir ${nome}`);
            if (!confirmation) return;
            await axios.delete(`/api/Client`, {
                params: { id: id },
            });
            getClients();
        } catch (error) {
            console.error("Erro ao excluir cliente:", error);
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
        if (term === "") {
            setFilteredClients(clients);
        } else {
            setFilteredClients(
                clients.filter((client) =>
                    client.nome.toLowerCase().includes(term.toLowerCase())
                )
            );
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

    const handleUpdateClient = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingClient) return;

        const formData = new FormData();
        formData.append("nome", editingClient.nome);
        if (fotoAluno) {
            formData.append("image", fotoAluno);
        }

        try {
            await axios.put(`/api/Client`, formData, {
                params: { id: editingClient._id },
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            alert("Cliente atualizado com sucesso!");
            setEditingClient(null);
            setFotoAluno(null);
            getClients();
        } catch (error) {
            console.error("Erro ao atualizar cliente:", error);
            alert("Erro ao atualizar cliente.");
        }
    };

    useEffect(() => {
        getClients(); // Carrega os clientes quando o componente é montado
    }, []);

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold text-center text-blue-800 mb-6">Lista de Clientes</h1>

            <input
                type="text"
                placeholder="Pesquisar cliente..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="block w-full max-w-md mx-auto mb-6 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
                className="flex m-auto items-center justify-center px-6 py-3 text-white bg-blue-500 rounded-full shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all"
                onClick={() => {
                    setFormAlunoVisible(!isFormAlunoVisible);
                    if (isFormAlunoVisible) setFormAlunoVisible(false);
                }}
            >
                {isFormAlunoVisible ? "Fechar Cadastro" : "Adicionar Aluno"}
            </button>

            {isFormAlunoVisible && (
                <div className="p-6 flex flex-col items-center justify-center">
                    <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
                        <h1 className="text-2xl font-bold text-blue-600 mb-6 text-center">Cadastrar Novo Aluno</h1>
                        <form
                            onSubmit={handleAlunoFormSubmit}
                            className="flex flex-col gap-4"
                        >
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

            {/* Formulário de edição */}
            {editingClient && (
                <div className="p-6 flex flex-col items-center justify-center">
                    <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full">
                        <h1 className="text-2xl font-bold text-blue-600 mb-6 text-center">Editar Cliente</h1>
                        <form onSubmit={handleUpdateClient} className="flex flex-col gap-4">
                            <input
                                type="text"
                                placeholder="Nome"
                                value={editingClient.nome}
                                onChange={(e) =>
                                    setEditingClient({ ...editingClient, nome: e.target.value })
                                }
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
                                Atualizar
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Lista de Clientes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {filteredClients.length > 0 ? (
                    filteredClients.map((client) => (
                        <div
                            key={client._id}
                            className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200"
                        >
                            <Link href={`/pages/client/${client._id}`}>
                                <Image
                                    src={client.image || "https://via.placeholder.com/150"}
                                    alt={client.nome}
                                    className="w-32 h-32 object-cover rounded-full mx-auto"
                                    width={200}
                                    height={200}
                                />
                                <h3 className="text-xl font-semibold text-center mt-4">{client.nome}</h3>
                            </Link>
                            {/* Botões de Ação */}
                            <div className="flex justify-center items-center mt-4 space-x-4">
                                <button
                                    className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600"
                                    onClick={() => setEditingClient(client)}
                                >
                                    <AiOutlineEdit size={20} />
                                </button>
                                <button
                                    className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700"
                                    onClick={() => deleteClient(client._id, client.nome)}
                                >
                                    <AiOutlineDelete size={20} />
                                </button>
                            </div>

                        </div>
                    ))
                ) : (
                    <p className="text-center text-gray-500">Nenhum cliente encontrado</p>
                )}
            </div>
        </div>
    );
}
