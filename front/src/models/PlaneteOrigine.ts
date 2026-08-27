import { EStatusPlanete } from "@enums/EStatusPlanete"
import { SecteurPlanetaire } from "./SecteurPlanetaire"

export type PlaneteOrigine =
{
    id: number,
    nom: string,
    description: string | null,
    nomFichier: string,
    statut: EStatusPlanete,
    secteur: SecteurPlanetaire,

    position: {
        x: number,
        y: number
    }
}

export type Secteur =
{
    id: number,
    nom: string,
    description: string | null,

    position: {
        x: number,
        y: number
    }
}

export type PlaneteConnecter = 
{
    idPlaneteA: number,
    idPlaneteB: number,
    distance: string
}

export type SecteurConnecter = 
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
