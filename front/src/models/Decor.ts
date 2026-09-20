export type DecorRequete =
{
    idSession: number,
    fichier: File,
    positionX: number,
    positionY: number,
    echelle: number,
    rotationDegres: number,
    ordreCalque: number

     /**
      * 0 => Tous (defaut)
      * 1 => MJ seulement
      */
    visibiliteMode: number
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