import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { DestroyRef, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ETypeRessource } from "../enums/ETypeRessource";

export class FichierService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/upload-fichier`;

    Upload(_idRessource: number, _typeRessource: ETypeRessource, _fichier: File): Observable<string>
    {   
        let formData = new FormData();
        formData.append("idRessource", _idRessource.toString());
        formData.append("typeRessource", _typeRessource.toString());
        formData.append("fichier", _fichier, _fichier.name);

        return this.http.post<string>(this.BASE_API, formData).pipe(takeUntilDestroyed(this.destroyRef));
    }
}
