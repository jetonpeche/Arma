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
    munitionMax: number,
    munitionDisponible: number,
    nbTourReload: number
    munitionInfini: boolean,
    estUsageUnique: boolean,
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