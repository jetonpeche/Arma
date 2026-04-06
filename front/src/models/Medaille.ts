export type Medaille =
{
    id: number,
    nom: string,
    description: string,
    groupe: number,
    nomFichier: string | null
    nbPoint: number
}

export type MedailleRequete =
{
    nom: string,
    description: string,
    groupe: number,
    nbPoint: number
}