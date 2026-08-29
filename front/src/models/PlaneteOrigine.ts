import { EStatusPlanete } from "@enums/EStatusPlanete"

export type PlaneteOrigine =
{
    id: number,
    idSysteme: number,
    nom: string,
    description: string | null,
    nomFichier: string,
    estPlaneteOrigine: boolean,
    statut: EStatusPlanete,

    positionX: number,
    positionY: number
}

export type PlaneteConnecter = 
{
    idPlaneteA: number,
    idPlaneteB: number,
    distance: string | null
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
    statut: EStatusPlanete,
    estPlaneteOrigine: boolean,

    positionX: number,
    positionY: number
}

export type PlaneteConnecterSupprimerRequete = Omit<PlaneteConnecter, "distance">;