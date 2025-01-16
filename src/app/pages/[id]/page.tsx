
import React from "react";
import PageClient from "./PageClient"; // Importa o componente cliente

interface Params {
    params: { id: string };
}

export default async function Page({ params }: Params) {
    const { id } = params; 
    return <PageClient id={id} />;
}
