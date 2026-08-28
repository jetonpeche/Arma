export type Systeme =
{
    id: number,
    nom: string,
    description: string | null,

    positionX: number,
    positionY: number
}

export type SystemeConnecter = 
{
    idSystemeA: number,
    idSystemeB: number,
    distance: string | null
}

export type SystemeLeger =
{
    id: number,
    nom: string
}

export type SystemePositionRequete =
{
    positionX: number,
    positionY: number
}

export type SystemeRequete = Omit<Systeme, "id">;
export type SystemeConnecterSupprimerRequete = Omit<SystemeConnecter, "distance">;