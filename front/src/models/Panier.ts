import { ETypeObjetProposer } from "@enums/ETypeObjetProposer"

export type Panier =
{
    id: number,
    type: ETypeObjetProposer,
    idType: number,
    idTypeStockage: number | null,
    nom: string,
    tailleUnitaireInventaire: number,
    quantite: number,
    prixUnitaire: number,
    volume: number,
    idStockage?: number | null,
    vaisseau?: {
        id: number,
        nom: string
    } | null
}