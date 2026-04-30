export type Medaille =
{
    id: number,
    nom: string,
    description: string,
    groupe: number,
    nomFichier: string | null
    nbPoint: number,
    obtentionUnique: boolean
}

export type MedailleRequete =
{
    nom: string,
    description: string,
    groupe: number,
    nbPoint: number
}

export type AttribuerMedailleRequete =
{
    idMedaille: number,
    listeIdPersonnage: number[]
}