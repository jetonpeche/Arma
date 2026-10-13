import { EEPionAjout } from "@enums/EPionAjout"

export type PionRequete = 
{
    idVaisseau: number,
    appartenance: EEPionAjout,

    positionX: number,
    positionY: number,
    rotationDegres: number,

     /**
     * 0 => Tous,
     * 1 => MJ uniquement
     */
    visibilite: number,

    nomCommandant: string | null,
    nomVaisseau: string | null
}

export type ModifierPionTransformRequete =
{
    idPion: string,
    positionX: number,
    positionY: number,
    rotationDegres: number,
    echelle: number,

    /**
      * 0 => Tous (defaut)
      * 1 => MJ seulement
      */
    visibiliteMode: number
}