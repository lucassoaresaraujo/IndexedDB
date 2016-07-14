"use strict";

var bd;

function iniciar() {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;

    if(!window.indexedDB) {
        alert("Seu navegador não possui suporte");
        return;
    }

    var request = indexedDB.open('tarefas',1);

    request.onerror = function (e) {
        console.log('Não foi possivel usar o armazenamento local' +e.error.name);
    }

    request.onsuccess = function (e) {
       bd = e.target.result;
       atualizarTabela(); 
    }
    
    request.onupgradeneeded = function (e) {
        bd = e.target.result;

        if (!bd.objectStoreNames.contains('tarefas')){
            var tarefas = bd.createObjectStore('tarefas', {
                autoIncrement: true
            });

            tarefas.createIndex('tarefa', 'tarefa', {unique: false});
            tarefas.createIndex('data', 'data', {unique: false});

        }
    }

    document.getElementById('btnIncluir').addEventListener('click', incluirTarefa, false);
    document.getElementById('btnBuscarTarefa').addEventListener('click', buscarTarefa, false);
    document.getElementById('btnBuscarData').addEventListener('click', buscarData, false);

}

function incluirTarefa() {
    var tarefa = document.getElementById('tarefa');
    var data = document.getElementById('data');
    var prioridade = document.getElementById('prioridade');

    if (tarefa.value == '' || data.value == ''){
        mostraAlerta('Preencha os campos <strong>Tarefa</strong> e <strong>Data Limite</strong> antes de fazer a inclusão',0);
    }

    var tarefasTransaction = bd.transaction(['tarefas'], 'readwrite').objectStore('tarefas');

    var request = tarefasTransaction.add({
        tarefa: tarefa.value,
        data: data.value,
        prioridade: prioridade.value
    });

    request.onsuccess = function (e) {
        mostraAlerta('Tarefa incluida com sucesso',1);
        tarefa.innerHTML = '';
        data.innerHTML = '';
        prioridade.value = 1;
    }

    request.onerror = function (e) {
        mostraAlerta('Não foi possivel incluir a tarefa',0);
    }
}


function mostraAlerta(msg, status) {

    var alerta = document.getElementById('alerta');
    if(status==0){
        alerta.setAttribute('class', 'alert alert-danger');
    }
    else if(status==1){
        alerta.setAttribute('class', 'alert alert-success');
    }
    else{
        alerta.setAttribute('class', 'alert');
    }

    alerta.innerHTML = msg;
    setTimeout(limpaAlerta, 5000);
    
}

function limpaAlerta() {
    var alerta = document.getElementById('alerta');
    alerta.setAttribute('class', 'alert');
    alerta.innerHTML = '&nbsp';
}

function buscarTarefa() {
    
}

function buscarData() {
    
}

function atualizarTabela() {
    var corpoTabela = document.getElementById('tabela');
    var linhasTabela = '';

    var transaction = bd.transaction(['tarefas']);
    var objectStore = transaction.objectStore('tarefas');
    var request = objectStore.openCursor();
    
    request.onsuccess = function (e) {
        var cursor = e.target.result;

        if (cursor){
            linhasTabela += '<tr>'+
            '<td>'+cursor.key+'</td>' +
            '<td id="tarefa-'+cursor.key+'">'+cursor.value.tarefa+'</td>'+
            '<td id="data-'+cursor.key+'">'+cursor.value.data+'</td>'+
            '<td id="prioridade-'+cursor.key+'">'+cursor.value.prioridade+'</td>'+
            '<td id="botoes->'+cursor.key+'">'+
                '<button class="btn btn-info" onclick="editarTarefa('+cursor.key+')"><span class="glyphicon glyphicon-pencil"></button>'+
                '<button class="btn btn-danger" onclick="apagarTarefa('+cursor.key+')"><span class="glyphicon glyphicon-trash"></button>'+
            '</td></tr>';

            cursor.continue();
        } else{
            corpoTabela.innerHTML = linhasTabela;
        }

    }
}

window.addEventListener("load",iniciar,false);