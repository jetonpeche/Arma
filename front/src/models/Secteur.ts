import { SystemePositionRequete } from "./Systeme"

export type Secteur =
{
    id: number,
    nom: string,
    couleurHexa: string,
    listePosition: SystemePositionRequete[]
}

export type SecteurSynchroniser =
{
    listeCaseAjouter: { positionX: number, positionY: number, idSecteur: number }[],
    listeCaseModifier: { positionX: number, positionY: number, idSecteurNouveau: number }[],
    listeCaseSupprimer: SystemePositionRequete[]
}

export type SecteurRequete =
{
    nom: string,
    couleurHexa: string
}