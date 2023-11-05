const simplegit = require('simple-git')

asd()

async function asd() {
    const git = simplegit('D:\\Toshi\\Documents\\NodeProjects\\gitdamn\\express_backend\\repos\\amitchandi\\test.git\\tree\\master')
    console.log(git)
    const result = await git.branchLocal()
    console.log(result)
}