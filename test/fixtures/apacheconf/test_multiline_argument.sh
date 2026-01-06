SecAction \
  "id:'900001', \
  phase:1, \
  t:none, \
  setvar:tx.critical_anomaly_score=5, \
  setvar:tx.error_anomaly_score=4, \
  setvar:tx.warning_anomaly_score=3, \
  setvar:tx.notice_anomaly_score=2, \
  nolog, \
  pass"