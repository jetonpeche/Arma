export type Formation =
{
    id: number,
    ordre: number,
    nomComplet: string,
    nomRaccourci: string,
    objectif: string,
    conditionReussite: string,
    personnelleRequis: string[],
    listeEtapeFormation: FormationEtape[]
}

export type FormationEtape =
{
    numeroEtape: number,
    description: string
}

export type FormationLeger =
{
    id: number,
    nomComplet: string,
    nomRaccourci: string
}

export type FormationRequete = Omit<Formation, "id">;