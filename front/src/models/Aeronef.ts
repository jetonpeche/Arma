export type Aeronef =
{
    id: number,
    nom: string,
    role: string,
    description: string | null,
    prix: number,
    urlImage: string
}

export type AeronefLeger =
{
    id: number,
    nom: string
}

export type AeronefRequete = Omit<Aeronef, "id">;