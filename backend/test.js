const { default: simpleGit } = require('simple-git')


async function asd() {
    var git = simpleGit('repos/chandiman/test.git')
    
    try {
        console.log(await git.log())
    } catch (e) {
        console.log(e.message.includes('does not have any commits yet'))
        const commands = [
            'rev-list',
            '-n',
            1,
            '--all'
        ]
        const asd = await simpleGit('repos/chandiman/test.git').raw(commands)
        console.log(asd == '')
    }
}

asd()