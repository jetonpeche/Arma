import { GradeLeger } from "./Grade"
import { PersonnageLeger } from "./Personnage"

export type Orbat =
{
    id: number,
    idParent: number | null,
    titre: string,
    indicatif: string | null,
    frequenceRadio: string | null,
    urlImage: string,
    listeSlot: OrbatSlot[]
}

export type OrbatSlot =
{
    id: number,
    gradeRequis: GradeLeger | null,
    personnage: PersonnageLeger | null,
    role: string,
    ordreAffichage: number,
    estOptionnel: boolean
}

export type OrbatSlotRequete =
{
    /* en cas d'ajout pas d'id */
    id?: number,
    idGradeRequis: number | null,
    idPersonnage: number | null,
    role: string,
    ordreAffichage: number,
    estOptionnel: boolean
}

export type OrbatRequete =
{
    idParent: number | null,
    titre: string,
    indicatif: string | null,
    frequenceRadio: string | null,
    urlImage: string,
    listeSlot: OrbatSlot[]
}