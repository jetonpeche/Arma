import { EStatusPlanete } from "@enums/EStatusPlanete"

export type PlaneteOrigine =
{
    id: number,
    idSysteme: number,
    nom: string,
    description: string | null,
    nomFichier: string,
    statut: EStatusPlanete,

    positionX: number,
    positionY: number
}

export type PlaneteConnecter = 
{
    idPlaneteA: number,
    idPlaneteB: number,
    distance: string
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
