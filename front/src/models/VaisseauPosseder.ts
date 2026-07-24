export type VaisseauPosseder =
{
    id: number,
    nomVaisseau: string,
    nomCommandant: string | null,
    nomVaisseauAlias: string | null,
    information: string | null,
    listeArmement: VaisseauPossederArmement[],
    listeStockage: VaisseauPossederStockage[]
}

export type VaisseauPossederArmement = 
{
    id: string,
    nom: string,
    information: string | null,
    nombreMax: number,
    nombreDisponible: number,
    nbTourReload: number,
    nbNombreReloadParNbTour: number,
    munitionInfini: boolean,
    estUsageUnique: boolean
}

export type VaisseauPossederStockage = 
{
    id: number,
    nom: string,
    nomTypeStockage: string,
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

export type VaisseauPossederContenuStockage =
{
    id: number,
    nom: string,
    quantite: number
}