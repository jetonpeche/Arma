import { EEPionAjout } from "@enums/EPionAjout"

export type PionRequete = 
{
    idVaisseau: number,
    Appartenance: EEPionAjout,

    positionX: number,
    positionY: number,
    rotationDegres: number,

     /// <summary>
     /// 0 => Tous,
     /// 1 => MJ uniquement
     /// </summary>
    visibilite: number,

    nomCommandant: string | null,
    nomVaisseau: string | null
}

export type ModifierPionTransformRequete =
{
    idPion: string,
    positionX: number,
    positionY: number,
    rotationDegres: number
}