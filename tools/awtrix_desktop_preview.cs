using System;
using System.Collections;
using System.Drawing;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Win32;

namespace AwtrixDesktopPreview
{
    internal static class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            try { Run(args); }
            catch (Exception error)
            {
                string path = Path.Combine(Path.GetTempPath(), "awtrix-desktop-preview-error.txt");
                string details;
                try { details = error.GetType().FullName + Environment.NewLine + error.Message + Environment.NewLine + error.StackTrace; }
                catch { details = "The startup exception could not be formatted."; }
                try { File.WriteAllText(path, details); } catch { }
                MessageBox.Show(details + Environment.NewLine + Environment.NewLine + "Log: " + path,
                    "AWTRIX NG Desktop Preview - startup error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static void Run(string[] args)
        {
            if (Array.Exists(args, delegate(string a) { return a == "--smoke-test"; })) return;
            if (Array.Exists(args, delegate(string a) { return a == "--help" || a == "-h"; }))
            {
                MessageBox.Show("AWTRIX NG Desktop Preview\n\nUsage: awtrix-desktop-preview.exe [device-url]", "AWTRIX NG Desktop Preview");
                return;
            }
            bool created;
            using (var activate = new EventWaitHandle(false, EventResetMode.AutoReset, "Local\\AWTRIX-NG-Desktop-Preview", out created))
            {
                if (!created) { activate.Set(); return; }
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                using (var form = new PreviewForm(args.Length > 0 ? args[0] : null))
                {
                    RegisteredWaitHandle registration = ThreadPool.RegisterWaitForSingleObject(activate, delegate
                    {
                        if (!form.IsDisposed && form.IsHandleCreated) form.BeginInvoke(new Action(form.ShowFromBackground));
                    }, null, Timeout.Infinite, false);
                    try { Application.Run(form); }
                    finally { registration.Unregister(null); }
                }
            }
        }
    }

    internal sealed class PreviewForm : Form
    {
        private const string SettingsKey = @"Software\AWTRIX NG\Desktop Preview";
        private const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
        private const string RunName = "AWTRIX NG Desktop Preview";
        private readonly NotifyIcon tray;
        private readonly System.Threading.Timer pollTimer;
        private readonly JavaScriptSerializer json = new JavaScriptSerializer();
        private readonly object frameLock = new object();
        private int[] pixels = new int[0];
        private int matrixWidth = 32;
        private int matrixHeight = 8;
        private int requestRunning;
        private int frameRate;
        private string deviceUrl;
        private string lastError = "Connecting";
        private bool exiting;

        [DllImport("user32.dll")]
        private static extern bool ReleaseCapture();
        [DllImport("user32.dll")]
        private static extern IntPtr SendMessage(IntPtr hWnd, int msg, IntPtr wParam, IntPtr lParam);

        public PreviewForm(string commandLineUrl)
        {
            Text = "AWTRIX NG Desktop Preview";
            BackColor = Color.Black;
            ClientSize = new Size(640, 160);
            MinimumSize = new Size(160, 40);
            FormBorderStyle = FormBorderStyle.None;
            ShowInTaskbar = false;
            DoubleBuffered = true;
            StartPosition = FormStartPosition.Manual;
            KeyPreview = true;

            deviceUrl = NormalizeUrl(commandLineUrl ?? Convert.ToString(ReadSetting("DeviceUrl", "")));
            TopMost = Convert.ToInt32(ReadSetting("TopMost", 1)) != 0;
            frameRate = Math.Max(10, Math.Min(30, Convert.ToInt32(ReadSetting("FrameRate", 20))));
            int x = Convert.ToInt32(ReadSetting("X", (Screen.PrimaryScreen.WorkingArea.Width - Width) / 2));
            int y = Convert.ToInt32(ReadSetting("Y", 40));
            int w = Math.Max(MinimumSize.Width, Convert.ToInt32(ReadSetting("Width", Width)));
            int h = Math.Max(MinimumSize.Height, Convert.ToInt32(ReadSetting("Height", Height)));
            Bounds = FitToScreens(new Rectangle(x, y, w, h));
            if (commandLineUrl != null) SaveSetting("DeviceUrl", deviceUrl);

            ContextMenuStrip menu = BuildMenu();
            ContextMenuStrip = menu;
            tray = new NotifyIcon();
            tray.Icon = SystemIcons.Application;
            tray.Text = Text;
            tray.Visible = true;
            tray.ContextMenuStrip = menu;
            tray.DoubleClick += delegate { ToggleWindow(); };

            MouseDown += DragWindow;
            KeyDown += delegate(object sender, KeyEventArgs e) { if (e.KeyCode == Keys.Escape) Hide(); };
            FormClosing += OnFormClosing;
            Move += delegate { SaveBounds(); };
            ResizeEnd += delegate { SaveBounds(); };

            Shown += delegate { if (String.IsNullOrEmpty(deviceUrl)) ChangeDevice(); };
            pollTimer = new System.Threading.Timer(Poll, null, 0, 1000 / frameRate);
        }

        private ContextMenuStrip BuildMenu()
        {
            var menu = new ContextMenuStrip();
            var visible = new ToolStripMenuItem("Show / hide window");
            visible.Click += delegate { ToggleWindow(); };
            var top = new ToolStripMenuItem("Always on top", null, delegate
            {
                TopMost = !TopMost;
                ((ToolStripMenuItem)menu.Items[1]).Checked = TopMost;
                SaveSetting("TopMost", TopMost ? 1 : 0);
            });
            top.Checked = TopMost;
            var address = new ToolStripMenuItem("Device address…", null, delegate { ChangeDevice(); });
            var startup = new ToolStripMenuItem("Start with Windows", null, delegate
            {
                SetStartup(!StartupEnabled());
                ((ToolStripMenuItem)menu.Items[3]).Checked = StartupEnabled();
            });
            startup.Checked = StartupEnabled();
            var refresh = new ToolStripMenuItem("Refresh rate");
            foreach (int value in new int[] { 10, 20, 30 })
            {
                int rate = value;
                var item = new ToolStripMenuItem(rate + " FPS");
                item.Checked = rate == frameRate;
                item.Click += delegate
                {
                    SetFrameRate(rate);
                    foreach (ToolStripMenuItem choice in refresh.DropDownItems) choice.Checked = Convert.ToInt32(choice.Tag) == frameRate;
                };
                item.Tag = rate;
                refresh.DropDownItems.Add(item);
            }
            var exit = new ToolStripMenuItem("Exit", null, delegate { exiting = true; Close(); });
            menu.Items.AddRange(new ToolStripItem[] { visible, top, address, startup, refresh, new ToolStripSeparator(), exit });
            return menu;
        }

        private void SetFrameRate(int value)
        {
            frameRate = Math.Max(10, Math.Min(30, value));
            SaveSetting("FrameRate", frameRate);
            if (pollTimer != null) pollTimer.Change(0, 1000 / frameRate);
        }

        private void Poll(object state)
        {
            if (String.IsNullOrEmpty(deviceUrl) || Interlocked.Exchange(ref requestRunning, 1) != 0) return;
            try
            {
                var request = (HttpWebRequest)WebRequest.Create(deviceUrl + "/api/v1/display/screen");
                request.Timeout = 2000;
                request.ReadWriteTimeout = 2000;
                request.UserAgent = "AWTRIX-NG-Desktop-Preview";
                using (var response = (HttpWebResponse)request.GetResponse())
                using (var reader = new StreamReader(response.GetResponseStream()))
                {
                    var root = json.DeserializeObject(reader.ReadToEnd()) as IDictionary;
                    if (root == null || !root.Contains("pixels")) throw new InvalidDataException("Invalid screen response");
                    int width = Convert.ToInt32(root["width"]);
                    int height = Convert.ToInt32(root["height"]);
                    var values = root["pixels"] as object[];
                    if (values == null || values.Length != width * height) throw new InvalidDataException("Invalid pixel count");
                    var next = new int[values.Length];
                    for (int i = 0; i < values.Length; i++) next[i] = Convert.ToInt32(values[i]);
                    lock (frameLock) { pixels = next; matrixWidth = width; matrixHeight = height; lastError = null; }
                }
            }
            catch (Exception error)
            {
                lock (frameLock) lastError = error.Message;
            }
            finally
            {
                Interlocked.Exchange(ref requestRunning, 0);
                if (!IsDisposed && IsHandleCreated) BeginInvoke(new Action(Invalidate));
            }
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            int[] frame;
            int width, height;
            string error;
            lock (frameLock) { frame = (int[])pixels.Clone(); width = matrixWidth; height = matrixHeight; error = lastError; }
            e.Graphics.Clear(Color.Black);
            if (frame.Length == width * height)
            {
                float cell = Math.Min(ClientSize.Width / (float)width, ClientSize.Height / (float)height);
                float ox = (ClientSize.Width - cell * width) / 2f;
                float oy = (ClientSize.Height - cell * height) / 2f;
                float gap = cell >= 8f ? 1f : 0f;
                for (int y = 0; y < height; y++)
                    for (int x = 0; x < width; x++)
                    {
                        int value = frame[y * width + x];
                        using (var brush = new SolidBrush(Color.FromArgb((value >> 16) & 255, (value >> 8) & 255, value & 255)))
                            e.Graphics.FillRectangle(brush, ox + x * cell, oy + y * cell, Math.Max(1, cell - gap), Math.Max(1, cell - gap));
                    }
            }
            if (error != null)
            {
                using (var brush = new SolidBrush(Color.FromArgb(210, 255, 80, 80))) e.Graphics.FillEllipse(brush, 8, 8, 8, 8);
                if (tray != null) tray.Text = Truncate("AWTRIX NG - " + error, 63);
            }
            else if (tray != null) tray.Text = Text;
        }

        private void ChangeDevice()
        {
            string value = DeviceDialog.Ask(deviceUrl);
            if (value == null) return;
            value = NormalizeUrl(value);
            if (String.IsNullOrEmpty(value)) return;
            deviceUrl = value;
            SaveSetting("DeviceUrl", deviceUrl);
            Poll(null);
        }

        private void ToggleWindow()
        {
            if (Visible) Hide();
            else ShowFromBackground();
        }

        public void ShowFromBackground()
        {
            Show(); WindowState = FormWindowState.Normal; Activate(); BringToFront();
        }

        private void DragWindow(object sender, MouseEventArgs e)
        {
            if (e.Button != MouseButtons.Left) return;
            ReleaseCapture();
            SendMessage(Handle, 0xA1, new IntPtr(2), IntPtr.Zero);
        }

        protected override void WndProc(ref Message m)
        {
            const int WM_NCHITTEST = 0x84;
            const int grip = 8;
            if (m.Msg == WM_NCHITTEST)
            {
                base.WndProc(ref m);
                Point p = PointToClient(new Point((short)((long)m.LParam & 0xffff), (short)(((long)m.LParam >> 16) & 0xffff)));
                bool left = p.X <= grip, right = p.X >= ClientSize.Width - grip;
                bool top = p.Y <= grip, bottom = p.Y >= ClientSize.Height - grip;
                if (left && top) m.Result = new IntPtr(13);
                else if (right && top) m.Result = new IntPtr(14);
                else if (left && bottom) m.Result = new IntPtr(16);
                else if (right && bottom) m.Result = new IntPtr(17);
                else if (left) m.Result = new IntPtr(10);
                else if (right) m.Result = new IntPtr(11);
                else if (top) m.Result = new IntPtr(12);
                else if (bottom) m.Result = new IntPtr(15);
                return;
            }
            base.WndProc(ref m);
        }

        private void OnFormClosing(object sender, FormClosingEventArgs e)
        {
            if (!exiting && e.CloseReason == CloseReason.UserClosing) { e.Cancel = true; Hide(); return; }
            SaveBounds();
            pollTimer.Dispose();
            tray.Visible = false;
            tray.Dispose();
        }

        private void SaveBounds()
        {
            if (WindowState != FormWindowState.Normal) return;
            SaveSetting("X", Left); SaveSetting("Y", Top); SaveSetting("Width", Width); SaveSetting("Height", Height);
        }

        private static Rectangle FitToScreens(Rectangle value)
        {
            Rectangle area = Screen.FromRectangle(value).WorkingArea;
            int width = Math.Min(value.Width, area.Width);
            int height = Math.Min(value.Height, area.Height);
            int x = Math.Max(area.Left, Math.Min(value.Left, area.Right - width));
            int y = Math.Max(area.Top, Math.Min(value.Top, area.Bottom - height));
            return new Rectangle(x, y, width, height);
        }

        private static string NormalizeUrl(string value)
        {
            value = (value ?? "").Trim().TrimEnd('/');
            if (value.Length > 0 && !value.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !value.StartsWith("https://", StringComparison.OrdinalIgnoreCase)) value = "http://" + value;
            return value;
        }

        private static object ReadSetting(string name, object fallback)
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.OpenSubKey(SettingsKey))
                    return key == null ? fallback : key.GetValue(name, fallback);
            }
            catch { return fallback; }
        }

        private static void SaveSetting(string name, object value)
        {
            try { using (RegistryKey key = Registry.CurrentUser.CreateSubKey(SettingsKey)) key.SetValue(name, value); }
            catch { }
        }

        private static bool StartupEnabled()
        {
            try { using (RegistryKey key = Registry.CurrentUser.OpenSubKey(RunKey)) return key != null && key.GetValue(RunName) != null; }
            catch { return false; }
        }

        private static void SetStartup(bool enabled)
        {
            try
            {
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(RunKey))
                {
                    if (enabled) key.SetValue(RunName, "\"" + Application.ExecutablePath + "\"");
                    else key.DeleteValue(RunName, false);
                }
            }
            catch (Exception error) { MessageBox.Show(error.Message, "Could not change startup setting"); }
        }

        private static string Truncate(string value, int max) { return value.Length <= max ? value : value.Substring(0, max); }
    }

    internal sealed class DeviceDialog : Form
    {
        private readonly TextBox address = new TextBox();
        private DeviceDialog(string current)
        {
            Text = "AWTRIX NG device";
            FormBorderStyle = FormBorderStyle.FixedDialog;
            StartPosition = FormStartPosition.CenterScreen;
            ClientSize = new Size(420, 116);
            MaximizeBox = false; MinimizeBox = false; ShowInTaskbar = true;
            var label = new Label { Left = 12, Top = 12, Width = 390, Text = "Device address (for example http://192.168.1.20)" };
            address.SetBounds(12, 36, 396, 24); address.Text = current ?? "";
            var ok = new Button { Text = "Connect", Left = 244, Top = 74, Width = 78, DialogResult = DialogResult.OK };
            var cancel = new Button { Text = "Cancel", Left = 330, Top = 74, Width = 78, DialogResult = DialogResult.Cancel };
            Controls.AddRange(new Control[] { label, address, ok, cancel });
            AcceptButton = ok; CancelButton = cancel;
        }
        public static string Ask(string current)
        {
            using (var dialog = new DeviceDialog(current)) return dialog.ShowDialog() == DialogResult.OK ? dialog.address.Text : null;
        }
    }
}
