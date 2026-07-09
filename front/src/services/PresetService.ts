import { HttpClient, HttpResponse, HttpStatusCode } from "@angular/common/http";
import { DestroyRef, inject } from "@angular/core";
import { Observable } from "rxjs";
import { environment } from "../environements/environement";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Preset, PresetRequete } from "@models/Preset";

export class PresetService
{
    private http = inject(HttpClient);
    private destroyRef: DestroyRef = inject(DestroyRef);

    private readonly BASE_API = `${environment.urlApi}/preset`;

    Recuperer(): Observable<Preset>
    {
        return this.http.get<Preset>(`${this.BASE_API}/recuperer`).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Modifier(_preset: PresetRequete): Observable<void>
    {
        return this.http.post<void>(`${this.BASE_API}/publier`, _preset).pipe(takeUntilDestroyed(this.destroyRef));
    }

    ModifierFichier(_fichier: File, _aliasNomFichier: string): Observable<void>
    {
        const FORM_DATA = new FormData();
        FORM_DATA.append("Nom", _aliasNomFichier);
        FORM_DATA.append("Fichier", _fichier, _fichier.name);

        return this.http.post<void>(`${this.BASE_API}/modifier-fichier`, FORM_DATA).pipe(takeUntilDestroyed(this.destroyRef));
    }

    Telecharger(): void
    {
        this.http.get(`${this.BASE_API}/telecharger`,
        {observe: "response", responseType: "blob" }
        )
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(reponse => this.TelechargerFichier(reponse));
    }

    private TelechargerFichier(_reponse: HttpResponse<Blob>): void
    {
        if(_reponse.status == HttpStatusCode.NoContent)
        return;
        
        let a = document.createElement("a");
        a.download = "preset.html";
        let url = URL.createObjectURL(_reponse.body as Blob);
        a.href = url;
        a.click();

        URL.revokeObjectURL(url);
    }
}