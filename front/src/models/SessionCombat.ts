export type SessionCombat = 
{

}

export type ModifierFondTransformRequete =
{
    hauteur: number,
    largeur: number
}

export type ModifierDecorTransformRequete =
{
    positionX: number,
    positionY: number,
    idDecor: string,
    echelle: number,
    rotationDegres: number,
    ordreCalque: number

     /**
      * 0 => Tous (defaut)
      * 1 => MJ seulement
      */
    visibiliteMode: number
}

export type ModifierPionTransformRequete =
{
    idPion: string,
    positionX: number,
    positionY: number,
    rotationDegres: number
}