import { TypeStockageLogistique } from "./Logistique"

export type Vaisseau =
{
    id: number,
    nom: string,
    prix: number,
    stock: number,
    role: string,
    listeArmement: VaisseauArmement[],
    listeStockage: VaisseauStockage[],
    vitesse: string,
    blindage: string,
    capaciteSpeciale: string | null,
    equipage: VaisseauEquipage
}

export type VaisseauArmement =
{
    id: string,
    nom: string,
    information: string | null,
    nombre: number,
    munition: number,
    nbTourReload: number
    munitionInifini: boolean,
    estUsageUnique: boolean,
}

export type VaisseauStockage = 
{
    id: number,
    nom: string,
    taille: number,
    typeStockage: TypeStockageLogistique
}

export type VaisseauEquipage = 
{
    nbPlacePassager: number,
    nbPlaceMarines: number
}

export type VaisseauAchaterRequete =
{
    idVaisseau: number,
    nomVaisseau: string | null,
    nomCommandant: string | null,
    information: string | null
}
