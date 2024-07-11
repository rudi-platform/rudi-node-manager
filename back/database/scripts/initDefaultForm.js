const mod = 'database'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { statusOK } from '../../utils/errors'
import { getContext, logE, sysError, sysInfo } from '../../utils/logger'
import { dbClose, dbOpen } from '../database'

// -------------------------------------------------------------------------------------------------
// Constants
// -------------------------------------------------------------------------------------------------
const DEFAULT_VAL_FORM = 'Default_Value_Form'

const sqlCreateDefaultFormTable =
  `CREATE TABLE IF NOT EXISTS ${DEFAULT_VAL_FORM} (userId INTEGER, name TEXT, defaultValue TEXT,` +
  'PRIMARY KEY(userId,name),' +
  'CONSTRAINT Roles_fk_user_Id FOREIGN KEY (userId) REFERENCES users(id)' +
  ' ON UPDATE CASCADE ON DELETE CASCADE);'

// -------------------------------------------------------------------------------------------------
// Functions
// -------------------------------------------------------------------------------------------------
export function dbInitDefaultFormTable(openedDb) {
  const fun = 'dbInitDefaultFormTable'
  const db = openedDb ?? dbOpen()
  return new Promise((resolve, reject) => {
    db.get(`SELECT name FROM sqlite_master WHERE type=? AND name=?`, ['table', DEFAULT_VAL_FORM], (err, row) => {
      if (err) {
        if (!openedDb) dbClose(db)
        logE(mod, fun + ' select', err.message)
        return reject(err)
      }
      if (row) {
        if (!openedDb) dbClose(db)
        return resolve({ status: `Table exists: '${DEFAULT_VAL_FORM}'` })
      }
      db.run(sqlCreateDefaultFormTable, (err) => {
        if (!openedDb) dbClose(db)
        if (err) {
          sysError(mod, `${fun}.create`, err.message, getContext(null, { opType: 'init_table_defaultForm' }))
          return reject(err)
        }
        sysInfo(mod, fun, `Table created: ${DEFAULT_VAL_FORM}`, getContext(null, { opType: 'init_table_defaultForm' }))
        resolve(statusOK(`Table created: ${DEFAULT_VAL_FORM}`))
      })
    })
  })
}
