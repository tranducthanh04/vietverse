# Internal helper: stdout goes only to bootstrap-production.cjs, never run alone.
param([switch]$Apply)
$ErrorActionPreference = 'Stop'
try {
    [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    [System.Windows.Forms.Application]::EnableVisualStyles()
    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'Vietverse - Customer catalog bootstrap'
    $form.Size = New-Object System.Drawing.Size(580, 425)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.TopMost = $true
    $info = New-Object System.Windows.Forms.Label
    $info.Location = New-Object System.Drawing.Point(20, 15)
    $info.Size = New-Object System.Drawing.Size(535, 90)
    $mode = if ($Apply) { 'Validate, migrate child languages, then load empty catalog.' } else { 'Dry-run only: no schema or catalog writes.' }
    $info.Text = "Target: thanh.841ysjn.mongodb.net / test`r`nDB user: binhlqhe181123_db_user`r`n$mode`r`nPassword stays in a private pipe; no Vercel env changes."
    $form.Controls.Add($info)
    $label = New-Object System.Windows.Forms.Label
    $label.Location = New-Object System.Drawing.Point(20, 108)
    $label.Size = New-Object System.Drawing.Size(535, 20)
    $label.Text = 'Current database user password (NOT Atlas website password):'
    $form.Controls.Add($label)
    $passwordBox = New-Object System.Windows.Forms.TextBox
    $passwordBox.Location = New-Object System.Drawing.Point(20, 135)
    $passwordBox.Size = New-Object System.Drawing.Size(525, 25)
    $passwordBox.UseSystemPasswordChar = $true
    $form.Controls.Add($passwordBox)
    $confirmLabel = New-Object System.Windows.Forms.Label
    $confirmLabel.Location = New-Object System.Drawing.Point(20, 168)
    $confirmLabel.Size = New-Object System.Drawing.Size(535, 20)
    $confirmLabel.Text = 'Confirm password:'
    $form.Controls.Add($confirmLabel)
    $confirmBox = New-Object System.Windows.Forms.TextBox
    $confirmBox.Location = New-Object System.Drawing.Point(20, 193)
    $confirmBox.Size = New-Object System.Drawing.Size(525, 25)
    $confirmBox.UseSystemPasswordChar = $true
    $form.Controls.Add($confirmBox)
    $exclusiveBox = New-Object System.Windows.Forms.CheckBox
    $exclusiveBox.Location = New-Object System.Drawing.Point(20, 225)
    $exclusiveBox.Size = New-Object System.Drawing.Size(525, 70)
    $exclusiveBox.Text = "I confirm: NO valid admin sessions/tokens for this app`r`nand NO app/external child or catalog writers during migration.`r`nIf unsure, cancel. Do not create/promote an admin during loading."
    $exclusiveBox.Visible = [bool]$Apply
    $form.Controls.Add($exclusiveBox)
    $errorLabel = New-Object System.Windows.Forms.Label
    $errorLabel.Location = New-Object System.Drawing.Point(20, 305)
    $errorLabel.Size = New-Object System.Drawing.Size(535, 20)
    $errorLabel.ForeColor = [System.Drawing.Color]::Red
    $form.Controls.Add($errorLabel)
    $submit = New-Object System.Windows.Forms.Button
    $submit.Text = if ($Apply) { 'Validate and load' } else { 'Validate only' }
    $submit.Location = New-Object System.Drawing.Point(285, 345)
    $submit.Size = New-Object System.Drawing.Size(160, 30)
    $submit.Add_Click({
        if ($passwordBox.Text.Length -eq 0 -or $passwordBox.Text -cne $confirmBox.Text) {
            $errorLabel.Text = 'Enter the same non-empty password in both fields.'
            return
        }
        if ($Apply -and -not $exclusiveBox.Checked) {
            $errorLabel.Text = 'Confirm the exclusive window, or cancel if unsure.'
            return
        }
        $form.DialogResult = [System.Windows.Forms.DialogResult]::OK
        $form.Close()
    })
    $form.Controls.Add($submit)
    $cancel = New-Object System.Windows.Forms.Button
    $cancel.Text = 'Cancel'
    $cancel.Location = New-Object System.Drawing.Point(455, 345)
    $cancel.Size = New-Object System.Drawing.Size(90, 30)
    $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.Controls.Add($cancel)
    $form.AcceptButton = $submit
    $form.CancelButton = $cancel
    $form.Add_Shown({ $passwordBox.Focus() })
    $timer = New-Object System.Windows.Forms.Timer
    $timer.Interval = 300000
    $timer.Add_Tick({ $form.DialogResult = [System.Windows.Forms.DialogResult]::Cancel; $form.Close() })
    $timer.Start()
    $result = $form.ShowDialog()
    $timer.Stop()
    if ($result -ne [System.Windows.Forms.DialogResult]::OK) {
        $passwordBox.Clear(); $confirmBox.Clear(); $form.Dispose(); $timer.Dispose()
        exit 2
    }
    $payload = @{ password = $passwordBox.Text; exclusiveWindowConfirmed = [bool]$exclusiveBox.Checked } | ConvertTo-Json -Compress
    $passwordBox.Clear(); $confirmBox.Clear(); $form.Dispose(); $timer.Dispose()
    [Console]::Out.Write($payload)
    $payload = $null
} catch {
    [Console]::Error.Write('PASSWORD_FORM_FAILED')
    exit 1
}
