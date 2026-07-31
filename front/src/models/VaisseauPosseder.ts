export type VaisseauPosseder =
{
    id: number,
    nomVaisseau: string,
    nomCommandant: string | null,
    nomVaisseauAlias: string | null,
    information: string | null,
    equipage: VaisseauPossederEquipage,
    listeArmement: VaisseauPossederArmement[],
    listeStockage: VaisseauPossederStockage[],
    listeAeronef: VaisseauPossederAeronef[]
}

export type VaisseauPossederEquipage = 
{
    nbPlacePassagerMax: number,
    nbPlaceMarinesMax: number,
    nbPlaceMarines: number,
    nbPlacePassager: number
}

export type VaisseauPossederAeronef =
{
    id: string,
    nom: string,
    description: string | null,
    nombreMax: number,
    nombreDisponible: number,
    nombreSortie: number,
    nombreDetruit: number
}

export type VaisseauPossederArmement = 
{
    id: string,
    nom: string,
    information: string | null,
    nombreMax: number,
    nombreDisponible: number,
    nombreDetruit: number,
    nbTourReload: number,
    nbNombreReloadParNbTour: number,
    munitionInfini: boolean,
    estUsageUnique: boolean
}

export type VaisseauPossederArmementRequete =
{
    idArmement: string,
    nombreDisponible: number,
    nombreDetruit: number,
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

export type VaisseauPossederRequete =
{
    information: string | null,
    nbPlaceMarines: number,
    nbPlacePassager: number
}