import { ETypeObjetProposer } from "@enums/ETypeObjetProposer"

export type Panier =
{
    id: number,
    type: ETypeObjetProposer,
    idType: number,
    idTypeStockage: number,
    nom: string,
    tailleUnitaireInventaire: number,
    quantite: number,
    prixUnitaire: number,
    volume?: number,
    idStockage?: number,
    vaisseau?: {
        id: number,
        nom: string
    }
}