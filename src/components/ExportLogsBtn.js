// @flow
import logger from 'logger'
import moment from 'moment'
import fs from 'fs'
import { webFrame, remote } from 'electron'
import React, { Component } from 'react'
import { translate } from 'react-i18next'
import KeyHandler from 'react-key-handler'
import Button from './base/Button'

function writeToFile(file, data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(file, data, error => {
      if (error) {
        reject(error)
      } else {
        resolve()
      }
    })
  })
}

class ExportLogsBtn extends Component<{
  t: *,
  hookToShortcut?: boolean,
}> {
  export = async () => {
    const resourceUsage = webFrame.getResourceUsage()
    logger.log('exportLogsMeta', {
      resourceUsage,
      release: __APP_VERSION__,
      git_commit: __GIT_REVISION__,
      environment: __DEV__ ? 'development' : 'production',
      userAgent: window.navigator.userAgent,
    })
    const date = new Date() // we don't want all the logs that happen after the Export was pressed ^^
    const path = remote.dialog.showSaveDialog({
      title: 'Export logs',
      defaultPath: `ledgerlive-export-${moment().format(
        'YYYY.MM.DD-HH.mm.ss',
      )}-${__GIT_REVISION__ || 'unversionned'}.json`,
      filters: [
        {
          name: 'All Files',
          extensions: ['json'],
        },
      ],
    })
    if (path) {
      const logs = await logger.queryAllLogs(date)
      const json = JSON.stringify(logs)
      await writeToFile(path, json)
    }
  }

  exporting = false
  handleExportLogs = () => {
    if (this.exporting) return
    this.exporting = true
    this.export()
      .catch(e => {
        logger.critical(e)
      })
      .then(() => {
        this.exporting = false
      })
  }

  onKeyHandle = e => {
    if (e.ctrlKey) {
      this.handleExportLogs()
    }
  }

  render() {
    const { t, hookToShortcut } = this.props
    return hookToShortcut ? (
      <KeyHandler keyValue="e" onKeyHandle={this.onKeyHandle} />
    ) : (
      <Button small primary event="ExportLogs" onClick={this.handleExportLogs}>
        {t('app:settings.exportLogs.btn')}
      </Button>
    )
  }
}

export default translate()(ExportLogsBtn)
