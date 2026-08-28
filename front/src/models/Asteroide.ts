import { EStatutAsteroide } from "@enums/EStatusAsteroide"

export type Asteroide =
{
    id: number,
    idSysteme: number,
    nom: string | null,
    description: string | null,
    statut: EStatutAsteroide,
    positionX: number,
    positionY: number
}

export type AsteroideConnecter = 
{
    idAsteroideA: number,
    idAsteroideB: number,
    distance: string | null
}

export type AsteroideConnecterSupprimerRequete = Omit<AsteroideConnecter, "distance">;
export type AsteroideRequete = Omit<Asteroide, "id">;