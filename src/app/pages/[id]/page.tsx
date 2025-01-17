import React from "react";
import PageClient from "./PageClient";
import type { PageProps } from "../../../types/page"; // Ajuste o caminho de importação conforme necessário

async function Page({ params }: PageProps) {
    const resolvedParams = await params; // Resolve a promise, se necessário
    const { id } = resolvedParams || {}; // Garante que id seja extraído corretamente
    return <PageClient id={id} />;
}

export default Page;
