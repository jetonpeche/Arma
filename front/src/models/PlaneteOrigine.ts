export type PlaneteOrigine =
{
    id: number,
    nom: string,
    description: string | null,
    nomFichier: string
}

export type PlaneteOrigineLeger =
{
    id: number,
    nom: string
}

export type PlaneteOrigineRequete = 
{
    nom: string,
    description: string | null,
}
