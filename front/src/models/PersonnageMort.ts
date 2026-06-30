export type PersonnageMortRequete =
{
    id: number,
    nom: string,
    matricule: string,
    dateNaissance: string,
    etatService: string | null,
    groupeSanguin: string,
    estFormateur: boolean,
    estFormateurSpecialite: boolean,
    formationFaite: boolean,
    idSpecialite: number,
    idPlaneteOrigine: number,
    dateMort: string,
    elogeFunebre: string | null
}

export type PersonnageMort =
{
    nom: string,
    dateNaissance: string,
    dateMort: string,
    nbOperation: number,
    nomGrade: string | null,
    nomSpecialite: string | null,
    elogeFunebre: string | null,
}