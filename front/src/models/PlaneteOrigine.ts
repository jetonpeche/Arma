import { EStatusPlanete } from "@enums/EStatusPlanete"

export type PlaneteOrigine =
{
    id: number,
    idSecteur: number,
    nom: string,
    description: string | null,
    nomFichier: string,
    statut: EStatusPlanete,

    positionX: number,
    positionY: number
}

export type Secteur =
{
    id: number,
    nom: string,
    description: string | null,

    positionX: number,
    positionY: number
}

export type PlaneteConnecter = 
{
    idPlaneteA: number,
    idPlaneteB: number,
    distance: string
}

export type SecteurConnecter = 
{
    idSecteurA: number,
    idSecteurB: number,
    distance: string
}

export type PlaneteOrigineLeger =
{
    id: number,
    nom: string
}

export type SecteurLeger =
{
    id: number,
    nom: string
}

export type PlaneteOrigineRequete = 
{
    nom: string,
    description: string | null,
}
