import { Component, OnInit } from '@angular/core';
import { EventoService } from 'src/app/_services/evento.service';
import { BsLocaleService } from 'ngx-bootstrap';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Evento } from 'src/app/_models/Evento';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-evento-edit',
  templateUrl: './eventoEdit.component.html',
  styleUrls: ['./eventoEdit.component.css']
})
export class EventoEditComponent implements OnInit {

  titulo = 'Editar Evento';
  evento: Evento = new Evento();
  imagemURL = 'assets/img/upload.png';
  registerForm: FormGroup;
  arquivo: File;
  fileNameToUpdate: string;

  dataAtual;

  get lotes(): FormArray {
   return <FormArray> this.registerForm.get('lotes');
  }
  get redesSociais(): FormArray {
    return <FormArray> this.registerForm.get('redesSociais');
   }

  constructor(
    private eventoService: EventoService,
    private fb: FormBuilder,
    private localeService: BsLocaleService,
    private toastr: ToastrService,
    private router: ActivatedRoute
    ) {
      this.localeService.use('pt-br');
    }

    ngOnInit() {
      this.validation();
      this.carregarEvento();
    }

    validation() {
      this.registerForm = this.fb.group({
        id: [],
        tema: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(50)]],
        local: ['', Validators.required],
        dataEvento: ['', Validators.required],
        imagemURL: [''],
        qtdPessoas: ['', [Validators.required, Validators.max(120000)]],
        telefone: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        lotes: this.fb.array([]),
        redesSociais:  this.fb.array([])
      });
    }

    carregarEvento() {
      const idEvento = +this.router.snapshot.paramMap.get('id');
      this.eventoService.getEventoById(idEvento).subscribe(
        (evento: Evento) => {
          this.evento = Object.assign({}, evento);
          this.fileNameToUpdate = evento.imagemURL.toString();

          this.imagemURL = `http://localhost:5000/resources/images/${this.evento.imagemURL}?_ts=${this.dataAtual}`;

          this.evento.imagemURL = '';
          this.registerForm.patchValue(this.evento);

          this.evento.lotes.forEach(lote => {
            this.lotes.push(this.criarLote(lote));
          });
          this.evento.redesSociais.forEach(redeSocial => {
            this.redesSociais.push(this.criarRedeSocial(redeSocial));
          });
        }
      );
    }

    criarLote(lote: any): FormGroup {
      return this.fb.group({
        id: [lote.id],
        nome: [lote.nome, Validators.required],
        quantidade: [lote.quantidade, Validators.required],
        preco: [lote.preco, Validators.required],
        dataInicio: [lote.dataInicio],
        dataFim: [lote.dataFim]
      });
    }

    criarRedeSocial(redeSocial: any): FormGroup {
      return this.fb.group({
        id: [redeSocial.id],
        nome: [redeSocial.nome, Validators.required],
        url: [redeSocial.url, Validators.required]
      });
    }

    adicionarLote() {
      this.lotes.push(this.criarLote({ id: 0 }));
    }

    adicionarRedeSocial() {
      this.redesSociais.push(this.criarRedeSocial({ id: 0 }));
    }

    removerLote(id: number) {
      this.lotes.removeAt(id);
    }

    removerRedeSocial(id: number) {
      this.redesSociais.removeAt(id);
    }

    onFileChange(files: FileList) {
      const file = files[0];
      const reader = new FileReader();

      this.arquivo = file;

      reader.onload = (event: any) => this.imagemURL = event.target.result;
      reader.readAsDataURL(file);
    }

    salvarEvento() {
      this.evento = Object.assign({id: this.evento.id }, this.registerForm.value);
      this.evento.imagemURL = this.fileNameToUpdate;

      this.uploadImagem();

      this.eventoService.putEvento(this.evento).subscribe(
          () => {
          this.toastr.success('Editado com Sucesso!');
          console.log(this.evento);
          }, error => {
          this.toastr.error(`Erro ao Editar: ${error}`);
          }
      );
    }

    uploadImagem() {
      if (this.registerForm.get('imagemURL').value !== '') {
      this.eventoService.postUpload(this.arquivo, this.fileNameToUpdate)
        .subscribe(
          () => {
           this.dataAtual = new Date().getMilliseconds().toString();
           this.imagemURL = `http://localhost:5000/resources/images/${this.evento.imagemURL}?_ts=${this.dataAtual}`;
          }
       );
      }
    }
  }
