import { ETypeModule } from "@enums/ETypeModule"
import { TypeStockageLogistique } from "./Logistique"
import { EEmplacementModule } from "@enums/EEmplacementModule"

export type Vaisseau =
{
    id: number,
    nom: string,
    prix: number,
    stock: number,
    role: string,
    nomFichier: string,
    nomFichierSprite: string,
    bloquerAchat: boolean,
    listeArmement: VaisseauArmement[],
    listeStockage: VaisseauStockage[],
    listeVaisseauEnfant: VaisseauLeger[],
    listeAeronef: VaisseauAeronef[],
    listeModule: VaisseauModule[],
    vitesse: string,
    blindage: string,
    capaciteSpeciale: string | null,
    equipage: VaisseauEquipage
}

export type VaisseauModule =
{
    id?: string,
    nom: string,
    type: ETypeModule,
    emplacement: EEmplacementModule,
    quantite: number,

    malusPousseeAvantPourcentageParUnite: number,
    malusFreinagePourcentageParUnite: number,

    malusVirageGauchePourcentageParUnite: number,
    malusVirageDroitePourcentageParUnite: number
}

export type VaisseauAeronef =
{
    id: number,
    nom: string,
    nombre: number
}

export type VaisseauLeger =
{
    id: number,
    nom: string
}

export type VaisseauArmement =
{
    id?: string,
    nom: string,
    information: string | null,
    nombre: number,
    nbTourReload: number
    munitionInfini: boolean,
    estUsageUnique: boolean,
    nbNombreReloadParNbTour: number
}

export type VaisseauStockage = 
{
    id: number,
    nom: string,
    taille: number,
    typeStockage: TypeStockageLogistique,
    contenuParDefaut: {
        idLogistique: number,
        quantite: number,
        nom: string
    }[]
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

export type VaisseauRequete =
{
    nom: string,
    prix: number,
    role: string,
    vitesse: string,
    blindage: string,
    bloquerAchat: boolean,
    capaciteSpeciale: string | null,
    equipage: VaisseauEquipage,
    listeArmement: VaisseauArmement[],
    listeStockage: VaisseauStockageRequete[],
    listeAeronef: VaisseauAeronefRequete[],
}

export type VaisseauAeronefRequete = 
{
    id: number,
    nombre: number
}

export type VaisseauStockageRequete = 
{
    id?: number,
    nom: string,
    taille: number,
    typeStockage: TypeStockageLogistique,
    contenuParDefaut: {
        idLogistique: number,
        quantite: number
    }[]
}
