# Internal helper. Run provision-admin.cjs, NEVER this script alone: stdout is a private pipe.
$ErrorActionPreference = 'Stop'
try {
    [Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    [System.Windows.Forms.Application]::EnableVisualStyles()
    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'Vietverse - Create administrator'
    $form.Size = New-Object System.Drawing.Size(600, 585)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.MinimizeBox = $false
    $form.TopMost = $true
    function Add-Label($text, $y, $height = 25) {
        $label = New-Object System.Windows.Forms.Label
        $label.Location = New-Object System.Drawing.Point(20, $y)
        $label.Size = New-Object System.Drawing.Size(550, $height)
        $label.Text = $text
        $form.Controls.Add($label)
    }
    function Add-Box($y, $secret, $value = '') {
        $box = New-Object System.Windows.Forms.TextBox
        $box.Location = New-Object System.Drawing.Point(20, $y)
        $box.Size = New-Object System.Drawing.Size(550, 25)
        $box.UseSystemPasswordChar = $secret
        $box.Text = $value
        $form.Controls.Add($box)
        return $box
    }
    Add-Label "Target: thanh.841ysjn.mongodb.net / test`r`nCreates ONE app admin. No reset/promotion of existing accounts." 15 45
    Add-Label 'Database User password (NOT your Atlas website password):' 65
    $dbPassword = Add-Box 90 $true
    Add-Label 'Admin email:' 125
    $email = Add-Box 150 $false 'admin@vietverse.edu.vn'
    Add-Label 'Display name:' 185
    $displayName = Add-Box 210 $false 'Vietverse Admin'
    Add-Label 'NEW admin login password (12+ characters, at most 72 UTF-8 bytes):' 245
    $password = Add-Box 270 $true
    Add-Label 'Confirm NEW admin login password:' 305
    $confirmation = Add-Box 330 $true
    $confirm = New-Object System.Windows.Forms.CheckBox
    $confirm.Location = New-Object System.Drawing.Point(20, 370)
    $confirm.Size = New-Object System.Drawing.Size(550, 55)
    $confirm.Text = "I authorize this admin account and confirm no catalog bootstrap,`r`nimport or other admin provisioning is running."
    $form.Controls.Add($confirm)
    $errorLabel = New-Object System.Windows.Forms.Label
    $errorLabel.Location = New-Object System.Drawing.Point(20, 435)
    $errorLabel.Size = New-Object System.Drawing.Size(550, 45)
    $errorLabel.ForeColor = [System.Drawing.Color]::Red
    $form.Controls.Add($errorLabel)
    $submit = New-Object System.Windows.Forms.Button
    $submit.Text = 'Create admin'
    $submit.Location = New-Object System.Drawing.Point(330, 495)
    $submit.Size = New-Object System.Drawing.Size(140, 30)
    $submit.Add_Click({
        if (-not $dbPassword.Text -or $email.Text.Trim() -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$' -or $displayName.Text.Trim().Length -lt 2 -or $displayName.Text.Trim().Length -gt 50) {
            $errorLabel.Text = 'Enter the database password, valid email and display name (2-50 characters).'
            return
        }
        if ($password.Text.Length -lt 12 -or [System.Text.Encoding]::UTF8.GetByteCount($password.Text) -gt 72 -or $password.Text -cne $confirmation.Text) {
            $errorLabel.Text = 'Admin passwords must match, with 12+ characters and at most 72 UTF-8 bytes.'
            return
        }
        if (-not $confirm.Checked) {
            $errorLabel.Text = 'Confirm account creation and no concurrent import, or cancel.'
            return
        }
        $form.DialogResult = [System.Windows.Forms.DialogResult]::OK
        $form.Close()
    })
    $form.Controls.Add($submit)
    $cancel = New-Object System.Windows.Forms.Button
    $cancel.Text = 'Cancel'
    $cancel.Location = New-Object System.Drawing.Point(480, 495)
    $cancel.Size = New-Object System.Drawing.Size(90, 30)
    $cancel.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
    $form.Controls.Add($cancel)
    $form.AcceptButton = $submit
    $form.CancelButton = $cancel
    $form.Add_Shown({ $dbPassword.Focus() })
    $timer = New-Object System.Windows.Forms.Timer
    $timer.Interval = 600000
    $timer.Add_Tick({ $form.DialogResult = [System.Windows.Forms.DialogResult]::Cancel; $form.Close() })
    $timer.Start()
    $result = $form.ShowDialog()
    $timer.Stop()
    if ($result -ne [System.Windows.Forms.DialogResult]::OK) { $form.Dispose(); $timer.Dispose(); exit 2 }
    $payload = @{
        dbPassword = $dbPassword.Text; email = $email.Text.Trim(); displayName = $displayName.Text.Trim()
        password = $password.Text; exclusiveWindowConfirmed = [bool]$confirm.Checked
    } | ConvertTo-Json -Compress
    $dbPassword.Clear(); $password.Clear(); $confirmation.Clear(); $form.Dispose(); $timer.Dispose()
    [Console]::Out.Write($payload)
    $payload = $null
} catch {
    [Console]::Error.Write('ADMIN_FORM_FAILED')
    exit 1
}
