import { EAppartenancePlanete, EStatusPlanete, ETypePlanete } from "@enums/EStatusPlanete"

export type PlaneteOrigine =
{
    id: number,
    idSysteme: number,
    nom: string,
    description: string | null,
    nomFichier: string,
    estPlaneteOrigine: boolean,
    statut: EStatusPlanete,
    type: ETypePlanete,
    appartenance: EAppartenancePlanete,
    densite: number,
    
    orbiteDecalageX: number | null,
    orbiteDecalageY: number | null,
    orbiteX: number | null,
    orbiteY: number | null,
    orbiteAngle: number | null,
    

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
    type: number,
    appartenance: number,

    positionX: number,
    positionY: number
}

export type PlaneteConnecterSupprimerRequete = Omit<PlaneteConnecter, "distance">;