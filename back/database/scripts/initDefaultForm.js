const mod = 'database'

// -------------------------------------------------------------------------------------------------
// Internal dependencies
// -------------------------------------------------------------------------------------------------
import { statusOK } from '../../utils/errors.js'
import { getContext, sysError, sysInfo } from '../../utils/logger.js'
import { dbClose, dbOpen } from '../database.js'

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
export async function dbInitDefaultFormTable(openedDb) {
  const fun = 'dbInitDefaultFormTable'
  const db = openedDb ?? dbOpen()
  try {
    const row = db.prepare(`SELECT name FROM sqlite_master WHERE type=? AND name=?`).get('table', DEFAULT_VAL_FORM)
    if (row) return { status: `Table exists: '${DEFAULT_VAL_FORM}'` }
    db.exec(sqlCreateDefaultFormTable)
    sysInfo(mod, fun, `Table created: ${DEFAULT_VAL_FORM}`, getContext(null, { opType: 'init_table_defaultForm' }))
    return statusOK(`Table created: ${DEFAULT_VAL_FORM}`)
  } catch (err) {
    sysError(mod, `${fun}.create`, err.message, getContext(null, { opType: 'init_table_defaultForm' }))
    throw err
  } finally {
    if (!openedDb) dbClose(db)
  }
}
