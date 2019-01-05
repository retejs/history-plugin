import History from './history';
import Action from './action';
import { AddNodeAction, RemoveNodeAction } from './actions/node';
import { AddConnectionAction, RemoveConnectionAction } from './actions/connection';

function install(editor, { keyboard = true }) {
    editor.bind('undo');
    editor.bind('redo');
    editor.bind('addhistory');

    const history = new History();

    editor.on('undo', () => history.undo());
    editor.on('redo', () => history.redo());
    editor.on('addhistory', action => history.add(action));

    editor.on('nodecreated', node => history.add(new AddNodeAction(editor, node)));
    editor.on('noderemoved', node => history.add(new RemoveNodeAction(editor, node)));
    editor.on('connectioncreated', c => history.add(new AddConnectionAction(editor, c)));
    editor.on('connectionremoved', c => history.add(new RemoveConnectionAction(editor, c)));

    
    if(keyboard) document.addEventListener('keydown', e => {
        if(!e.ctrlKey) return;

        switch(e.code) {
            case 'KeyZ': editor.trigger('undo'); break;
            case 'KeyY': editor.trigger('redo'); break;
        }
    });
}

export default {
    name: 'history',
    install,
    Action
}