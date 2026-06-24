import { VaisseauArmement } from "./Vaisseau"

export type VaisseauPosseder =
{
    id: number,
    nomVaisseau: string,
    nomCommandant: string,
    nomVaisseauAlias: string,
    listeArmement: VaisseauArmement[],
    listeStockage: VaisseauPossederStockage[]
}

export type VaisseauPossederStockage = 
{
    id: number,
    nom: string,
    taille: number,
    occuper: number,
    disponible: number
}

export type VaisseauPossederStockageCompatible = 
{
    id: number,
    nomVaisseau: string,
    nomVaisseauAlias: string,
    listeStockage: VaisseauPossederStockage[]
}