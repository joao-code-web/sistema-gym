import React from "react";
import PageClient from "./PageClient"; // Importa o componente cliente

interface PageProps {
    params: { id: string };
}

// Corrigir o tipo de retorno da função assíncrona
export default function Page({ params }: PageProps) {
    const { id } = params; 
    return <PageClient id={id} />;
}
