"use strict";

var bd;

function iniciar() {

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
        atualizarTabela();
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

function editarTarefa(n) {

    var tarefa = document.getElementById('tarefa-'+n);
    var data = document.getElementById('data-'+n);
    var prioridade = document.getElementById('prioridade-'+n);
    var botoes = document.getElementById('botoes-'+n);

    //pegando os valores atual
    var tarefaAnterior = tarefa.innerHTML;
    var dataAnterior = data.innerHTML;
    var prioridadeAnterior = prioridade.innerHTML;

    tarefa.innerHTML = '<input class="form-control" type="text" id="tarefaNova-'+n+'" value="'+tarefaAnterior+'" data-anterior="'+tarefaAnterior+'" />';
    data.innerHTML = '<input class="form-control" type="date" id="dataNova-'+n+'" value="'+dataAnterior+'" data-anterior="'+dataAnterior+'" />';
    
    prioridade.innerHTML = '<select class="form-control" id="prioridadeNova-'+n+'" data-anterior="'+prioridadeAnterior+'">'+
    '<option '+(prioridadeAnterior==1?'selected':'')+'>1</option>' + 
    '<option '+(prioridadeAnterior==2?'selected':'')+'>2</option>' +
    '<option '+(prioridadeAnterior==3?'selected':'')+'>3</option>' +
    '</select>';

    botoes.innerHTML = '<button class="btn btn-success" onclick="alteracaoOk('+n+')"><span class="glyphicon glyphicon-ok"></span></button>'+
    '<button class="btn btn-danger" onclick="alteracaoCancelada('+n+')"><span class="glyphicon glyphicon-remove"></span></button>';
}

function alteracaoOk(n) {
    var tarefaNova = document.getElementById('tarefaNova-'+n).value;
    var dataNova = document.getElementById('dataNova-'+n).value;
    var prioridadeNova = document.getElementById('prioridadeNova-'+n).value;
    
    var request = bd.transaction(['tarefas'], 'readwrite').objectStore('tarefas').get(n);

    request.onsuccess = function (e) {
        var tarefa = e.target.result;
        if(tarefa){
            tarefa.tarefa = tarefaNova;
            tarefa.data = dataNova;
            tarefa.prioridade = prioridadeNova;
            e.target.source.put(tarefa,n).onsuccess = function (e) {
                mostraAlerta("Alteração Concluida",1);
            } 
        } else {
                mostraAlerta("Não foi possivel realizar alteração",0);
        }

    atualizarTabela();
    }
}

function alteracaoCancelada(n) {
    
    document.getElementById('tarefa-'+n).innerHTML = 
    document.getElementById('tarefaNova-'+n).getAttribute('data-anterior');

    document.getElementById('data-'+n).innerHTML = 
    document.getElementById('dataNova-'+n).getAttribute('data-anterior');

    document.getElementById('prioridade-'+n).innerHTML = 
    document.getElementById('prioridadeNova-'+n).getAttribute('data-anterior'     );

    document.getElementById('botoes-'+n).innerHTML = '<button class="btn btn-info" onclick="editarTarefa('+n+')"><span class="glyphicon glyphicon-pencil"></button>'+
                '<button class="btn btn-danger" onclick="apagarTarefa('+n+')"><span class="glyphicon glyphicon-trash"></button>';
}

function apagarTarefa(n) {

    var request = bd.transaction(['tarefas'], 'readwrite').objectStore('tarefas').delete(n);

    request.onsuccess = function (e) {
        mostraAlerta('Tarefa Excluida com sucesso',1);
        atualizarTabela();
    }


    
}

function buscarTarefa() {
    document.getElementById('resultados').innerHTML = '';
    var tarefa = document.getElementById('buscarTarefa').value;
    var faixaBusca = IDBKeyRange.bound(tarefa,tarefa.substr(0,tarefa.length-1)+String.fromCharCode(tarefa.charCodeAt(tarefa.length-1)+1),false,true)

    
    bd.transaction('tarefas').objectStore('tarefas').index('tarefa').openCursor(faixaBusca).onsuccess = listaResultado;
    document.getElementById('cabecalho').innerHTML = "Resultados para <strong>Tarefa: '"+tarefa+"'</strong>";
    document.getElementById('buscarTarefa').value = '';
    document.getElementById('buscarData').value = '';
}



function buscarData() {
    document.getElementById('resultados').innerHTML = '';
    var data = document.getElementById('buscarData').value;
    var faixaBusca = IDBKeyRange.upperBound(data, false);

    
    bd.transaction('tarefas').objectStore('tarefas').index('data').openCursor(faixaBusca).onsuccess = listaResultado;
    document.getElementById('cabecalho').innerHTML = "Resultados para <strong>Data <="+data+"</strong>";
    document.getElementById('buscarTarefa').value = '';
    document.getElementById('buscarData').value = ''; 
}

function listaResultado(e) {
    var cursor = e.target.result;

    if (cursor){
        document.getElementById('resultados').innerHTML += 
        '<p>Código: '+cursor.primaryKey+'<br/>Tarefa: '+cursor.value.tarefa+
        '<br/>Prioridade: '+cursor.value.prioridade+'</p>';
        cursor.continue();
    } 
}

function atualizarTabela() {
    var corpoTabela = document.getElementById('tabela');
    var linhasTabela = '';

    var transaction = bd.transaction(['tarefas']);
    var objectStore = transaction.objectStore('tarefas');
    //abrir o cursor pra pegar vários dados do indexeddb
    var request = objectStore.openCursor();
    
    request.onsuccess = function (e) {
        var cursor = e.target.result;
//se tiver o campo atual do curso, pegue esses dados
        if (cursor){
            linhasTabela += '<tr>'+
            '<td>'+cursor.key+'</td>' +
            '<td id="tarefa-'+cursor.key+'">'+cursor.value.tarefa+'</td>'+
            '<td id="data-'+cursor.key+'">'+cursor.value.data+'</td>'+
            '<td id="prioridade-'+cursor.key+'">'+cursor.value.prioridade+'</td>'+
            '<td id="botoes-'+cursor.key+'">'+
                '<button class="btn btn-info" onclick="editarTarefa('+cursor.key+')"><span class="glyphicon glyphicon-pencil"></button>'+
                '<button class="btn btn-danger" onclick="apagarTarefa('+cursor.key+')"><span class="glyphicon glyphicon-trash"></button>'+
            '</td></tr>';
//faça o incremento no campo atual do cursor
            cursor.continue();
        } else{
            //só entra aqui quando não existe mais o campo atual, posso mostrar os dados, já peguei todos
            corpoTabela.innerHTML = linhasTabela;
        }

    }
}

window.addEventListener("load",iniciar,false);