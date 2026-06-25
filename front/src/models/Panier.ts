import { ETypeObjetProposer } from "@enums/ETypeObjetProposer"

export type Panier =
{
    type: ETypeObjetProposer,
    idType: number,
    nom: string,
    quantite: number,
    prixUnitaire: number,
    volume?: number,
    idStockage?: number,
    vaisseau?: {
        id: number,
        nom: string
    }
}